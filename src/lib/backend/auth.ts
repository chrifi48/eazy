import "server-only";
import { cookies } from "next/headers";
import { from } from "./query";
import { hashPassword, verifyPassword } from "./password";
import { PENDING_COOKIE, SESSION_COOKIE, SESSION_DAYS, signSession, verifySession } from "./session";
import { decryptSecret, encryptSecret, hashCode, newRecoveryCodes, newSecret, otpauthUri, verifyTotp } from "./totp";
import { rateLimit } from "@/lib/rate-limit";

export type User = { id: string; email: string; role: string };
type AuthError = { message: string } | null;

export async function currentUser(): Promise<User | null> {
  const s = await verifySession(cookies().get(SESSION_COOKIE)?.value);
  // the 5-minute "password ok, code pending" token must never count as a logged-in session
  return s && s.role !== "pending" ? { id: s.sub, email: s.email, role: s.role } : null;
}

const cookieOpts = (maxAge: number) => ({ httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/", maxAge });

async function setSession(u: User) {
  cookies().set(SESSION_COOKIE, await signSession({ sub: u.id, email: u.email, role: u.role }), cookieOpts(SESSION_DAYS * 86400));
  cookies().delete(PENDING_COOKIE);
}

const getProfile = async (id: string) => (await from("profiles").select("*").eq("id", id).single()).data;

/** Same shape the app used before (auth.getUser / signInWithPassword / signOut / updateUser), backed by our own cookie session. */
export const auth = {
  async getUser(): Promise<{ data: { user: User | null }; error: AuthError }> {
    return { data: { user: await currentUser() }, error: null };
  },

  /** Step 1. If two-factor is on, only a short-lived "pending" cookie is issued and `requires2fa` is true. */
  async signInWithPassword({ email, password }: { email: string; password: string }): Promise<{ data: { user: User | null }; error: AuthError; requires2fa?: boolean }> {
    const mail = email.trim().toLowerCase();
    if (!(await rateLimit(`login:${mail}`, 8, 10 * 60_000))) return { data: { user: null }, error: { message: "Too many attempts, try again in a few minutes" } };
    const { data: p } = await from("profiles").select("id,email,role,password_hash,totp_enabled").eq("email", mail).maybeSingle();
    if (!p || !verifyPassword(password, p.password_hash)) return { data: { user: null }, error: { message: "Invalid email or password" } };
    const user = { id: p.id, email: p.email, role: p.role };
    if (p.totp_enabled) {
      cookies().set(PENDING_COOKIE, await signSession({ sub: p.id, email: p.email, role: "pending" }, "5m"), cookieOpts(300));
      return { data: { user: null }, error: null, requires2fa: true };
    }
    await setSession(user);
    return { data: { user }, error: null };
  },

  /** Step 2: authenticator code or one-time recovery code. */
  async completeTwoFactor(code: string): Promise<{ data: { user: User | null }; error: AuthError }> {
    const pending = await verifySession(cookies().get(PENDING_COOKIE)?.value);
    if (!pending || pending.role !== "pending") return { data: { user: null }, error: { message: "Session expired, sign in again" } };
    if (!(await rateLimit(`2fa:${pending.sub}`, 6, 10 * 60_000))) return { data: { user: null }, error: { message: "Too many attempts, try again in a few minutes" } };
    const p = await getProfile(pending.sub);
    if (!p?.totp_enabled || !p.totp_secret) return { data: { user: null }, error: { message: "Two-factor is not enabled" } };

    const step = verifyTotp(decryptSecret(p.totp_secret), code, Number(p.totp_last_step));
    let ok = false;
    if (step !== null) {
      ok = true;
      await from("profiles").update({ totp_last_step: step }).eq("id", p.id); // a code can only be used once
    } else if (/[a-z0-9]{5}-?[a-z0-9]{5}/i.test(code)) {
      const h = hashCode(code);
      if ((p.recovery_codes as string[]).includes(h)) {
        ok = true;
        await from("profiles").update({ recovery_codes: (p.recovery_codes as string[]).filter((x) => x !== h) }).eq("id", p.id);
      }
    }
    if (!ok) return { data: { user: null }, error: { message: "Invalid code" } };
    const user = { id: p.id, email: p.email, role: p.role };
    await setSession(user);
    return { data: { user }, error: null };
  },

  async signOut() {
    cookies().delete(SESSION_COOKIE);
    cookies().delete(PENDING_COOKIE);
    return { error: null };
  },

  async updateUser(patch: { password?: string; email?: string }): Promise<{ error: AuthError }> {
    const me = await currentUser();
    if (!me) return { error: { message: "Not authenticated" } };
    if (patch.password) {
      const { error } = await from("profiles").update({ password_hash: hashPassword(patch.password) }).eq("id", me.id);
      if (error) return { error };
    }
    if (patch.email) {
      const email = patch.email.trim().toLowerCase();
      const { error } = await from("profiles").update({ email }).eq("id", me.id);
      if (error) return { error: { message: error.code === "23505" ? "Email already in use" : error.message } };
      await setSession({ ...me, email });
    }
    return { error: null };
  },

  // ---- two-factor management (called from Admin → Account)
  async twoFactorStatus(): Promise<{ enabled: boolean; recoveryLeft: number }> {
    const me = await currentUser();
    const p = me && (await getProfile(me.id));
    return { enabled: !!p?.totp_enabled, recoveryLeft: (p?.recovery_codes as string[] | undefined)?.length ?? 0 };
  },

  /** Generates a secret (stored encrypted, not yet active) and the otpauth link to show as a QR code. */
  async twoFactorSetup(): Promise<{ secret?: string; uri?: string; error?: string }> {
    const me = await currentUser();
    if (!me) return { error: "Not authenticated" };
    const secret = newSecret();
    const { error } = await from("profiles").update({ totp_secret: encryptSecret(secret), totp_enabled: false }).eq("id", me.id);
    if (error) return { error: error.message };
    return { secret, uri: otpauthUri(secret, me.email, "eazy admin") };
  },

  /** Activates two-factor once the user proves their app works. Returns the recovery codes (shown once). */
  async twoFactorEnable(code: string): Promise<{ codes?: string[]; error?: string }> {
    const me = await currentUser();
    const p = me && (await getProfile(me.id));
    if (!p?.totp_secret) return { error: "Start the setup first" };
    const step = verifyTotp(decryptSecret(p.totp_secret), code, 0);
    if (step === null) return { error: "Invalid code. Check the time on your phone and try again." };
    const codes = newRecoveryCodes();
    await from("profiles").update({ totp_enabled: true, totp_last_step: step, recovery_codes: codes.map(hashCode) }).eq("id", p.id);
    return { codes };
  },

  async twoFactorDisable(password: string, code: string): Promise<{ error?: string }> {
    const me = await currentUser();
    const p = me && (await getProfile(me.id));
    if (!p) return { error: "Not authenticated" };
    if (!verifyPassword(password, p.password_hash)) return { error: "Wrong password" };
    const ok = p.totp_secret && verifyTotp(decryptSecret(p.totp_secret), code, Number(p.totp_last_step)) !== null;
    if (!ok) return { error: "Invalid code" };
    await from("profiles").update({ totp_enabled: false, totp_secret: null, recovery_codes: [], totp_last_step: 0 }).eq("id", p.id);
    return {};
  },
};

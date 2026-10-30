// Edge-safe (used by middleware): signs and verifies the admin session cookie. No Node-only imports here.
import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "eazy_session";
export const SESSION_DAYS = 7;
export const PENDING_COOKIE = "eazy_2fa"; // short-lived, only proves the password step passed

export type Session = { sub: string; email: string; role: string };

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s) {
    if (process.env.NODE_ENV === "production") throw new Error("AUTH_SECRET is required in production");
    return new TextEncoder().encode("dev-only-secret-change-me-dev-only-secret");
  }
  return new TextEncoder().encode(s);
}

export async function signSession(s: Session, expires: string = `${SESSION_DAYS}d`) {
  return new SignJWT({ email: s.email, role: s.role }).setProtectedHeader({ alg: "HS256" }).setSubject(s.sub).setIssuedAt().setExpirationTime(expires).sign(secret());
}

export async function verifySession(token?: string): Promise<Session | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload.sub ? { sub: payload.sub, email: String(payload.email), role: String(payload.role) } : null;
  } catch {
    return null;
  }
}

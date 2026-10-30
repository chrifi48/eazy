"use server";

import QRCode from "qrcode";
import { requireAdmin } from "@/lib/admin-auth";
import { logActivity } from "@/lib/activity";

const fail = (e: unknown) => ({ error: e instanceof Error ? e.message : "Failed" });

export async function startTwoFactor(): Promise<{ qr?: string; secret?: string; error?: string }> {
  try {
    const { sb } = await requireAdmin();
    const r = await sb.auth.twoFactorSetup();
    if (r.error || !r.uri || !r.secret) return { error: r.error ?? "Failed" };
    return { qr: await QRCode.toDataURL(r.uri, { margin: 1, width: 220 }), secret: r.secret };
  } catch (e) { return fail(e); }
}

export async function enableTwoFactor(code: string): Promise<{ codes?: string[]; error?: string }> {
  try {
    const { sb, user } = await requireAdmin();
    const r = await sb.auth.twoFactorEnable(code);
    if (!r.error) await logActivity(sb, user.id, "enable", "two_factor");
    return r;
  } catch (e) { return fail(e); }
}

export async function disableTwoFactor(password: string, code: string): Promise<{ error?: string }> {
  try {
    const { sb, user } = await requireAdmin();
    const r = await sb.auth.twoFactorDisable(password, code);
    if (!r.error) await logActivity(sb, user.id, "disable", "two_factor");
    return r;
  } catch (e) { return fail(e); }
}

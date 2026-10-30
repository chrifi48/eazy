"use server";

import { requireAdmin } from "@/lib/admin-auth";
import { logActivity } from "@/lib/activity";

export async function changePassword(password: string): Promise<{ error?: string }> {
  try {
    const { sb, user } = await requireAdmin();
    if (password.length < 10) return { error: "Use at least 10 characters" };
    const { error } = await sb.auth.updateUser({ password });
    if (error) return { error: error.message };
    await logActivity(sb, user.id, "update", "password");
    return {};
  } catch (e) { return { error: e instanceof Error ? e.message : "Failed" }; }
}

export async function changeEmail(email: string): Promise<{ error?: string }> {
  try {
    const { sb, user } = await requireAdmin();
    if (!/^[^@s]+@[^@s]+.[^@s]+$/.test(email)) return { error: "Invalid email" };
    const { error } = await sb.auth.updateUser({ email });
    if (error) return { error: error.message };
    await logActivity(sb, user.id, "update", "email");
    return {};
  } catch (e) { return { error: e instanceof Error ? e.message : "Failed" }; }
}

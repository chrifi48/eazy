"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { logActivity } from "@/lib/activity";
import { cleanHtml } from "@/lib/sanitize";

const ALLOWED = ["brand", "contact", "home", "currency", "maintenance_mode", "legal", "seo", "private_email_templates"];

export async function saveSetting(key: string, value: unknown): Promise<{ error?: string }> {
  try {
    if (!ALLOWED.includes(key)) return { error: "Unknown setting" };
    const { sb, user } = await requireAdmin();
    if (key === "legal" && value && typeof value === "object") {
      value = Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, typeof v === "string" ? cleanHtml(v) : v]));
    }
    const { error } = await sb.from("site_settings").upsert({ key, value: value as never }, { onConflict: "key" });
    if (error) return { error: error.message };
    await logActivity(sb, user.id, "update", "site_settings", key);
    revalidatePath("/", "layout");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed" };
  }
}

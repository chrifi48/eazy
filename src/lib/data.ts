import { from } from "@/lib/backend/query";

// Public catalogue reads go straight to the local database (server components only).
export const pub = () => ({ from });

// The local database is always available at runtime; only skip it while `next build` collects pages.
export const hasSupabase = () => process.env.NEXT_PHASE !== "phase-production-build";

export { L } from "./l";

/** Run a query, returning a fallback if Supabase is unreachable/unconfigured so pages still render. */
export async function safe<T>(fn: () => PromiseLike<{ data: T | null; error: unknown }>, fallback: T): Promise<T> {
  if (!hasSupabase()) return fallback;
  try {
    const { data, error } = await fn();
    return error || data == null ? fallback : data;
  } catch {
    return fallback;
  }
}

export async function getSetting<T = Record<string, unknown>>(key: string, fallback: T): Promise<T> {
  const rows = await safe(() => pub().from("site_settings").select("value").eq("key", key).limit(1), [] as { value: T }[]);
  return (rows[0]?.value as T) ?? fallback;
}

export type Contact = { email?: string; phone?: string; whatsapp?: string; address?: string; maps?: string; social?: Record<string, string> };
export const getContact = () => getSetting<Contact>("contact", {});

export const whatsappLink = (number?: string, text?: string) => {
  const n = (number || process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "").replace(/\D/g, "");
  return n ? `https://wa.me/${n}${text ? `?text=${encodeURIComponent(text)}` : ""}` : "";
};

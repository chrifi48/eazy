"use server";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/backend/server";
import { slugify } from "@/lib/format";
import { logActivity } from "@/lib/activity";
import { byKey } from "./config";

const LOCALES = ["fr", "ar", "en"] as const;

async function adminClient() {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data: p } = await sb.from("profiles").select("role").eq("id", user.id).single();
  if (p?.role !== "admin") throw new Error("Not an admin");
  return { sb, user };
}

const lines = (v: unknown) => String(v ?? "").split("\n").map((x) => x.trim()).filter(Boolean);

export type SaveInput = { key: string; id?: string | null; values: Record<string, any>; multi: Record<string, string[]>; gallery?: { image_url: string; device: string }[] };

export async function saveRecord(input: SaveInput): Promise<{ error?: string; id?: string }> {
  try {
    const { sb, user } = await adminClient();
    const res = byKey(input.key);
    if (!res) return { error: "Unknown resource" };
    const v = input.values;
    const row: Record<string, any> = {};

    for (const f of res.fields) {
      if (f.kind === "i18n") {
        for (const l of LOCALES) row[`${f.name}_${l}`] = v[`${f.name}_${l}`] ?? "";
        if (f.required && !String(row[`${f.name}_fr`]).trim()) return { error: `${f.label} (FR) is required` };
      } else if (f.kind === "lines") {
        for (const l of LOCALES) row[`${f.name}_${l}`] = lines(v[`${f.name}_${l}`]);
      } else if (f.kind === "list") row[f.name] = lines(v[f.name]);
      else if (f.kind === "images") row[f.name] = Array.isArray(v[f.name]) ? v[f.name] : [];
      else if (f.kind === "bool") row[f.name] = Boolean(v[f.name]);
      else if (f.kind === "number") {
        const n = v[f.name] === "" || v[f.name] == null ? 0 : Number(v[f.name]);
        if (Number.isNaN(n)) return { error: `${f.label} must be a number` };
        row[f.name] = n;
      } else if (f.kind === "select") {
        const val = v[f.name] || null;
        if (f.required && !val) return { error: `${f.label} is required` };
        row[f.name] = val ?? (f.nullable ? null : undefined);
        if (row[f.name] === undefined) delete row[f.name];
      } else if (f.kind === "text" || f.kind === "textarea" || f.kind === "url" || f.kind === "image") {
        const val = String(v[f.name] ?? "").trim();
        if (f.kind === "text" && f.required && !val) return { error: `${f.label} is required` };
        if (f.name === "slug") continue; // handled below
        row[f.name] = val || (f.kind === "image" || f.kind === "url" ? null : "");
      }
    }
    // text columns that are NOT NULL keep '' ; nullable ones accept null
    if (res.hasSlug) {
      const base = String(v.slug || "").trim() || String(row[res.slugFrom!] || row[res.slugFrom!.replace("_en", "_fr")] || "");
      row.slug = slugify(base);
      if (!row.slug) return { error: "Slug could not be generated" };
    }
    if (res.key === "templates" && row.price_max < row.price_min) return { error: "Max price must be ≥ min price" };
    if (res.key === "features" && row.price_max < row.price_min) return { error: "Max price must be ≥ min price" };
    if (res.key === "testimonials") row.rating = Math.min(5, Math.max(1, Math.round(row.rating || 5)));

    let id = input.id ?? null;
    if (id) {
      const { error } = await sb.from(res.table).update(row).eq("id", id);
      if (error) return { error: error.message };
    } else {
      if (res.ordered) {
        const { data: last } = await sb.from(res.table).select("sort_order").order("sort_order", { ascending: false }).limit(1);
        row.sort_order = (last?.[0]?.sort_order ?? 0) + 1;
      }
      const { data, error } = await sb.from(res.table).insert(row).select("id").single();
      if (error) return { error: error.message };
      id = data.id;
    }

    for (const f of res.fields) {
      if (f.kind === "multi") {
        await sb.from(f.table).delete().eq(f.key, id!);
        const ids = input.multi[f.name] ?? [];
        if (ids.length) {
          const { error } = await sb.from(f.table).insert(ids.map((o) => ({ [f.key]: id, [f.other]: o })));
          if (error) return { error: error.message };
        }
      }
      if (f.kind === "gallery" && input.gallery) {
        await sb.from("template_images").delete().eq("template_id", id!);
        if (input.gallery.length) {
          const { error } = await sb.from("template_images").insert(input.gallery.map((g, i) => ({ template_id: id, image_url: g.image_url, device: g.device === "mobile" ? "mobile" : "desktop", sort_order: i })));
          if (error) return { error: error.message };
        }
      }
    }

    await logActivity(sb, user.id, input.id ? "update" : "create", res.table, id!, { name: row.name_fr ?? row.title_fr ?? row.client_name ?? row.question_fr });
    revalidatePath("/", "layout");
    return { id: id! };
  } catch (e: any) {
    return { error: e.message ?? "Failed" };
  }
}

export async function deleteRecord(key: string, id: string): Promise<{ error?: string }> {
  try {
    const { sb, user } = await adminClient();
    const res = byKey(key);
    if (!res) return { error: "Unknown resource" };
    const { error } = await sb.from(res.table).delete().eq("id", id);
    if (error) return { error: error.code === "23503" || error.code === "23001" ? "This item is still used elsewhere (e.g. a category with templates). Deactivate it instead." : error.message };
    await logActivity(sb, user.id, "delete", res.table, id);
    revalidatePath("/", "layout");
    return {};
  } catch (e: any) {
    return { error: e.message ?? "Failed" };
  }
}

/** Swap an item with its neighbour (up/down ordering). */
export async function moveRecord(key: string, id: string, dir: "up" | "down"): Promise<{ error?: string }> {
  try {
    const { sb } = await adminClient();
    const res = byKey(key);
    if (!res?.ordered) return { error: "Not sortable" };
    const { data } = await sb.from(res.table).select("id").order("sort_order").order("id");
    const ids = (data ?? []).map((r: any) => r.id as string);
    const i = ids.indexOf(id);
    const j = dir === "up" ? i - 1 : i + 1;
    if (i < 0 || j < 0 || j >= ids.length) return {};
    [ids[i], ids[j]] = [ids[j], ids[i]];
    await Promise.all(ids.map((rid, n) => sb.from(res.table).update({ sort_order: n + 1 }).eq("id", rid)));
    revalidatePath("/", "layout");
    return {};
  } catch (e: any) {
    return { error: e.message ?? "Failed" };
  }
}

/** Drag-and-drop: persist the full new order (ids from top to bottom). */
export async function reorderRecords(key: string, ids: string[]): Promise<{ error?: string }> {
  try {
    const { sb } = await adminClient();
    const res = byKey(key);
    if (!res?.ordered) return { error: "Not sortable" };
    for (let i = 0; i < ids.length; i++) {
      const { error } = await sb.from(res.table).update({ sort_order: i + 1 }).eq("id", ids[i]);
      if (error) return { error: error.message };
    }
    revalidatePath("/", "layout");
    return {};
  } catch (e: any) {
    return { error: e.message ?? "Failed" };
  }
}

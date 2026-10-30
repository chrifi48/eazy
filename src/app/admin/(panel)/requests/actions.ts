"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { logActivity } from "@/lib/activity";

type R = { error?: string };
const fail = (e: unknown): R => ({ error: e instanceof Error ? e.message : "Failed" });

export async function setStatus(id: string, status: string): Promise<R> {
  try {
    const { sb, user } = await requireAdmin();
    const { error } = await sb.from("project_requests").update({ status }).eq("id", id);
    if (error) return { error: error.message };
    await logActivity(sb, user.id, "status", "project_requests", id, { status });
    revalidatePath("/admin", "layout");
    return {};
  } catch (e) { return fail(e); }
}

export async function savePayments(id: string, v: { final_price: string; deposit_amount: string; deposit_paid: boolean; final_paid: boolean }): Promise<R> {
  try {
    const { sb, user } = await requireAdmin();
    const num = (s: string) => (s === "" ? null : Number(s));
    const fp = num(v.final_price), dp = num(v.deposit_amount);
    if ((fp !== null && Number.isNaN(fp)) || (dp !== null && Number.isNaN(dp))) return { error: "Amounts must be numbers" };
    const { error } = await sb.from("project_requests").update({ final_price: fp, deposit_amount: dp, deposit_paid: v.deposit_paid, final_paid: v.final_paid }).eq("id", id);
    if (error) return { error: error.message };
    await logActivity(sb, user.id, "update", "project_requests", id, v);
    revalidatePath("/admin", "layout");
    return {};
  } catch (e) { return fail(e); }
}

export async function addNote(id: string, note: string): Promise<R> {
  try {
    const { sb } = await requireAdmin();
    if (!note.trim()) return { error: "Note is empty" };
    const { error } = await sb.from("request_notes").insert({ request_id: id, note: note.trim() });
    if (error) return { error: error.message };
    revalidatePath(`/admin/requests/${id}`);
    return {};
  } catch (e) { return fail(e); }
}

export async function deleteNote(requestId: string, noteId: string): Promise<R> {
  try {
    const { sb } = await requireAdmin();
    const { error } = await sb.from("request_notes").delete().eq("id", noteId);
    if (error) return { error: error.message };
    revalidatePath(`/admin/requests/${requestId}`);
    return {};
  } catch (e) { return fail(e); }
}

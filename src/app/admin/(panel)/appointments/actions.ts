"use server";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { logActivity } from "@/lib/activity";
import { apptLabel, sendTemplated } from "@/lib/email";

type R = { error?: string };
const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
const fromMin = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

async function notify(a: any, status: string) {
  const r = a.project_requests;
  if (!r?.email) return;
  await sendTemplated("appointment_update", r.email, { reference: r.reference, name: r.client_name, appointment: apptLabel(a.date, a.start_time, a.end_time), status });
}

export async function setAppointmentStatus(id: string, status: "confirmed" | "done" | "cancelled" | "pending"): Promise<R> {
  try {
    const { sb, user } = await requireAdmin();
    const { data, error } = await sb.from("appointments").update({ status }).eq("id", id).select("*, project_requests(reference,client_name,email)").single();
    if (error) return { error: error.code === "23505" ? "That slot is taken by another appointment" : error.message };
    await logActivity(sb, user.id, status, "appointments", id);
    if (status !== "pending") await notify(data, status);
    revalidatePath("/admin", "layout");
    return {};
  } catch (e: any) { return { error: e.message }; }
}

export async function rescheduleAppointment(id: string, date: string, start: string): Promise<R> {
  try {
    const { sb, user } = await requireAdmin();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(start)) return { error: "Pick a valid date and time" };
    const { data: cur } = await sb.from("appointments").select("start_time,end_time").eq("id", id).single();
    if (!cur) return { error: "Not found" };
    const len = toMin(cur.end_time) - toMin(cur.start_time);
    const { data, error } = await sb.from("appointments")
      .update({ date, start_time: start, end_time: fromMin(toMin(start) + len), status: "confirmed", reminder_sent: false })
      .eq("id", id).select("*, project_requests(reference,client_name,email)").single();
    if (error) return { error: error.code === "23505" ? "That slot is already booked" : error.message };
    await logActivity(sb, user.id, "reschedule", "appointments", id, { date, start });
    await notify(data, "rescheduled");
    revalidatePath("/admin", "layout");
    return {};
  } catch (e: any) { return { error: e.message }; }
}

// ---- availability settings
export async function saveAvailability(rows: { weekday: number; is_active: boolean; start_time: string; end_time: string; slot_minutes: number; break_start: string; break_end: string; max_per_day: string }[]): Promise<R> {
  try {
    const { sb, user } = await requireAdmin();
    for (const r of rows) {
      if (r.is_active && toMin(r.end_time) <= toMin(r.start_time)) return { error: "End time must be after start time" };
    }
    await sb.from("availability").delete().gte("weekday", 0);
    const toInsert = rows.filter((r) => r.is_active).map((r) => ({
      weekday: r.weekday, is_active: true, start_time: r.start_time, end_time: r.end_time, slot_minutes: Number(r.slot_minutes) || 60,
      break_start: r.break_start || null, break_end: r.break_end || null, max_per_day: r.max_per_day === "" ? null : Number(r.max_per_day),
    }));
    if (toInsert.length) {
      const { error } = await sb.from("availability").insert(toInsert);
      if (error) return { error: error.message };
    }
    await logActivity(sb, user.id, "update", "availability");
    revalidatePath("/admin/availability");
    return {};
  } catch (e: any) { return { error: e.message }; }
}

export async function addBlockedDate(date: string, reason: string): Promise<R> {
  try {
    const { sb } = await requireAdmin();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { error: "Pick a date" };
    const { error } = await sb.from("blocked_dates").upsert({ date, reason: reason || null }, { onConflict: "date" });
    if (error) return { error: error.message };
    revalidatePath("/admin/availability");
    return {};
  } catch (e: any) { return { error: e.message }; }
}

export async function removeBlockedDate(id: string): Promise<R> {
  try {
    const { sb } = await requireAdmin();
    const { error } = await sb.from("blocked_dates").delete().eq("id", id);
    if (error) return { error: error.message };
    revalidatePath("/admin/availability");
    return {};
  } catch (e: any) { return { error: e.message }; }
}

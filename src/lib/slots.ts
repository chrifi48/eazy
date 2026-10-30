import "server-only";
import { createAdminClient } from "@/lib/backend/admin";

const TZ = "Africa/Casablanca";
const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
const fromMin = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

/** Current date/time in Morocco, as { date: 'YYYY-MM-DD', minutes }. */
export function nowInMorocco() {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
    .formatToParts(new Date()).reduce<Record<string, string>>((a, p) => ((a[p.type] = p.value), a), {});
  return { date: `${parts.year}-${parts.month}-${parts.day}`, minutes: Number(parts.hour) * 60 + Number(parts.minute) };
}

export type Slot = { start: string; end: string };

/** Free slots per date between from..to (inclusive). Uses the service role so visitors never read appointments directly. */
export async function getAvailableSlots(from: string, to: string): Promise<Record<string, Slot[]>> {
  const sb = createAdminClient();
  const [{ data: avail }, { data: blocked }, { data: booked }] = await Promise.all([
    sb.from("availability").select("*").eq("is_active", true),
    sb.from("blocked_dates").select("date").gte("date", from).lte("date", to),
    sb.from("appointments").select("date,start_time").gte("date", from).lte("date", to).in("status", ["pending", "confirmed"]),
  ]);
  const blockedSet = new Set((blocked ?? []).map((b) => b.date as string));
  const bookedByDate = new Map<string, Set<string>>();
  for (const b of booked ?? []) {
    const d = b.date as string;
    if (!bookedByDate.has(d)) bookedByDate.set(d, new Set());
    bookedByDate.get(d)!.add((b.start_time as string).slice(0, 5));
  }
  const now = nowInMorocco();
  const out: Record<string, Slot[]> = {};

  for (let d = new Date(from + "T00:00:00Z"); d <= new Date(to + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() + 1)) {
    const date = d.toISOString().slice(0, 10);
    if (date < now.date || blockedSet.has(date)) continue;
    const rows = (avail ?? []).filter((a) => a.weekday === d.getUTCDay());
    const taken = bookedByDate.get(date) ?? new Set<string>();
    const slots: Slot[] = [];
    let cap = Infinity;
    for (const r of rows) {
      if (r.max_per_day != null) cap = Math.min(cap, r.max_per_day);
      const step = r.slot_minutes as number;
      for (let m = toMin(r.start_time); m + step <= toMin(r.end_time); m += step) {
        if (r.break_start && r.break_end && m < toMin(r.break_end) && m + step > toMin(r.break_start)) continue;
        if (date === now.date && m <= now.minutes + 60) continue; // at least 1h notice
        if (taken.has(fromMin(m))) continue;
        slots.push({ start: fromMin(m), end: fromMin(m + step) });
      }
    }
    if (taken.size >= cap) continue;
    if (slots.length) out[date] = slots.sort((a, b) => a.start.localeCompare(b.start));
  }
  return out;
}

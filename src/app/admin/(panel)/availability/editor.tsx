"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button, Card, Input, Select } from "@/components/ui";
import { addBlockedDate, removeBlockedDate, saveAvailability } from "../appointments/actions";

const DAYS = [[1, "Monday"], [2, "Tuesday"], [3, "Wednesday"], [4, "Thursday"], [5, "Friday"], [6, "Saturday"], [0, "Sunday"]] as const;
const t5 = (v?: string | null) => (v ? v.slice(0, 5) : "");

export default function AvailabilityEditor({ avail, blocked }: { avail: any[]; blocked: any[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState("");
  const [rows, setRows] = useState(DAYS.map(([wd]) => {
    const a = avail.find((x) => x.weekday === wd);
    return { weekday: wd as number, is_active: !!a, start_time: t5(a?.start_time) || "09:00", end_time: t5(a?.end_time) || "17:00", slot_minutes: a?.slot_minutes ?? 60, break_start: t5(a?.break_start), break_end: t5(a?.break_end), max_per_day: a?.max_per_day == null ? "" : String(a.max_per_day) };
  }));
  const [bd, setBd] = useState({ date: "", reason: "" });
  const upd = (i: number, p: Partial<(typeof rows)[number]>) => setRows((r) => r.map((x, k) => (k === i ? { ...x, ...p } : x)));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Availability</h1>
        <p className="text-sm text-muted-foreground">Clients can only book inside these hours. Times are Morocco time.</p>
      </div>
      <Card className="overflow-x-auto p-5">
        <table className="w-full min-w-[760px] text-sm">
          <thead><tr className="text-start text-xs text-muted-foreground"><th className="pb-2 text-start">Day</th><th className="text-start">From</th><th className="text-start">To</th><th className="text-start">Slot</th><th className="text-start">Break from</th><th className="text-start">Break to</th><th className="text-start">Max / day</th></tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.weekday} className="border-t border-border">
                <td className="py-2"><label className="flex items-center gap-2 font-medium"><input type="checkbox" checked={r.is_active} onChange={(e) => upd(i, { is_active: e.target.checked })} className="accent-[#F97316]" />{DAYS[i][1]}</label></td>
                <td><Input type="time" disabled={!r.is_active} value={r.start_time} onChange={(e) => upd(i, { start_time: e.target.value })} className="!w-28" /></td>
                <td><Input type="time" disabled={!r.is_active} value={r.end_time} onChange={(e) => upd(i, { end_time: e.target.value })} className="!w-28" /></td>
                <td><Select disabled={!r.is_active} value={r.slot_minutes} onChange={(e) => upd(i, { slot_minutes: Number(e.target.value) })} className="!w-24">{[30, 45, 60, 90].map((m) => (<option key={m} value={m}>{m} min</option>))}</Select></td>
                <td><Input type="time" disabled={!r.is_active} value={r.break_start} onChange={(e) => upd(i, { break_start: e.target.value })} className="!w-28" /></td>
                <td><Input type="time" disabled={!r.is_active} value={r.break_end} onChange={(e) => upd(i, { break_end: e.target.value })} className="!w-28" /></td>
                <td><Input type="number" min={1} disabled={!r.is_active} value={r.max_per_day} placeholder="∞" onChange={(e) => upd(i, { max_per_day: e.target.value })} className="!w-20" /></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-4 flex items-center gap-3">
          <Button disabled={pending} onClick={() => start(async () => { const r = await saveAvailability(rows); setMsg(r.error ?? "Saved"); if (!r.error) router.refresh(); })}>Save availability</Button>
          {msg && <span role="status" className="text-sm text-muted-foreground">{msg}</span>}
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="mb-3 font-semibold">Blocked dates (holidays, days off)</h2>
        <div className="mb-4 flex flex-wrap gap-2">
          <Input type="date" value={bd.date} onChange={(e) => setBd({ ...bd, date: e.target.value })} className="!w-auto" aria-label="Date" />
          <Input value={bd.reason} onChange={(e) => setBd({ ...bd, reason: e.target.value })} placeholder="Reason (optional)" className="!w-64" />
          <Button disabled={pending || !bd.date} onClick={() => start(async () => { const r = await addBlockedDate(bd.date, bd.reason); if (r.error) setMsg(r.error); else { setBd({ date: "", reason: "" }); router.refresh(); } })}>Block date</Button>
        </div>
        <ul className="divide-y divide-border text-sm">
          {blocked.map((b) => (<li key={b.id} className="flex items-center justify-between py-2"><span><b>{b.date}</b> {b.reason && <span className="text-muted-foreground">— {b.reason}</span>}</span>
            <button aria-label="Remove" onClick={() => start(async () => { await removeBlockedDate(b.id); router.refresh(); })} className="text-red-600"><Trash2 className="h-4 w-4" /></button></li>))}
          {!blocked.length && <li className="py-3 text-muted-foreground">No blocked dates.</li>}
        </ul>
      </Card>
    </div>
  );
}

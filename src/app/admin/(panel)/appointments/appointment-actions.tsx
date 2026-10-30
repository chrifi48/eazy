"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, Input } from "@/components/ui";
import { rescheduleAppointment, setAppointmentStatus } from "./actions";

export default function AppointmentActions({ id, status, date, start }: { id: string; status: string; date: string; start: string }) {
  const router = useRouter();
  const [pending, startT] = useTransition();
  const [open, setOpen] = useState(false);
  const [d, setD] = useState(date);
  const [t, setT] = useState(start);
  const [err, setErr] = useState("");

  const run = (fn: () => Promise<{ error?: string }>) => startT(async () => {
    const r = await fn();
    setErr(r.error ?? "");
    if (!r.error) { setOpen(false); router.refresh(); }
  });
  const closed = status === "cancelled" || status === "done";

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {status === "pending" && <Button className="!px-3 !py-1.5 text-xs" disabled={pending} onClick={() => run(() => setAppointmentStatus(id, "confirmed"))}>Confirm</Button>}
        {!closed && <Button variant="outline" className="!px-3 !py-1.5 text-xs" disabled={pending} onClick={() => setOpen(!open)}>Reschedule</Button>}
        {!closed && <Button variant="outline" className="!px-3 !py-1.5 text-xs" disabled={pending} onClick={() => run(() => setAppointmentStatus(id, "done"))}>Mark done</Button>}
        {!closed && <Button variant="outline" className="!px-3 !py-1.5 text-xs text-red-600" disabled={pending} onClick={() => confirm("Cancel this appointment? The client will be emailed.") && run(() => setAppointmentStatus(id, "cancelled"))}>Cancel</Button>}
      </div>
      {open && (
        <div className="mt-2 flex flex-wrap gap-2">
          <Input type="date" value={d} onChange={(e) => setD(e.target.value)} className="!w-auto" aria-label="New date" />
          <Input type="time" value={t} onChange={(e) => setT(e.target.value)} className="!w-auto" aria-label="New time" />
          <Button className="!py-2 text-xs" disabled={pending} onClick={() => run(() => rescheduleAppointment(id, d, t))}>Save</Button>
        </div>
      )}
      {err && <p role="alert" className="mt-1 text-xs text-red-600">{err}</p>}
    </div>
  );
}

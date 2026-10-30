"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button, Card, Field, Input, Select, Textarea } from "@/components/ui";
import { STATUSES } from "../../../_components/status";
import { addNote, deleteNote, savePayments, setStatus } from "../actions";

type Payments = { final_price: string | number; deposit_amount: string | number; deposit_paid: boolean; final_paid: boolean };

export default function RequestPanel({ id, status, payments, notes }: { id: string; status: string; payments: Payments; notes: any[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [st, setSt] = useState(status);
  const [pay, setPay] = useState({ ...payments, final_price: String(payments.final_price), deposit_amount: String(payments.deposit_amount) });
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState("");

  const run = (fn: () => Promise<{ error?: string }>, ok?: string) => start(async () => {
    const r = await fn();
    setMsg(r.error ?? ok ?? "");
    if (!r.error) router.refresh();
  });

  return (
    <>
      <Card className="p-5 print:hidden">
        <h2 className="mb-3 font-semibold">Status</h2>
        <div className="flex gap-2">
          <Select value={st} onChange={(e) => setSt(e.target.value)}>{STATUSES.map(([k, l]) => (<option key={k} value={k}>{l}</option>))}</Select>
          <Button disabled={pending || st === status} onClick={() => run(() => setStatus(id, st), "Status updated")}>Save</Button>
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="mb-3 font-semibold">Price & payments</h2>
        <div className="space-y-3">
          <Field label="Final agreed price (MAD)"><Input type="number" min={0} value={pay.final_price} onChange={(e) => setPay({ ...pay, final_price: e.target.value })} /></Field>
          <Field label="Deposit amount (MAD)"><Input type="number" min={0} value={pay.deposit_amount} onChange={(e) => setPay({ ...pay, deposit_amount: e.target.value })} /></Field>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={pay.deposit_paid} onChange={(e) => setPay({ ...pay, deposit_paid: e.target.checked })} className="accent-[#F97316]" />Deposit paid</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={pay.final_paid} onChange={(e) => setPay({ ...pay, final_paid: e.target.checked })} className="accent-[#F97316]" />Final payment paid</label>
          <Button className="print:hidden" disabled={pending} onClick={() => run(() => savePayments(id, { ...pay, final_price: pay.final_price, deposit_amount: pay.deposit_amount }), "Saved")}>Save</Button>
        </div>
      </Card>

      <Card className="p-5 print:hidden">
        <h2 className="mb-3 font-semibold">Private notes</h2>
        <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Only you can see these notes" />
        <Button className="mt-2" disabled={pending || !note.trim()} onClick={() => run(async () => { const r = await addNote(id, note); if (!r.error) setNote(""); return r; })}>Add note</Button>
        <ul className="mt-4 space-y-3">
          {notes.map((n) => (
            <li key={n.id} className="rounded-xl bg-muted p-3 text-sm">
              <p className="whitespace-pre-line">{n.note}</p>
              <p className="mt-1 flex items-center justify-between text-xs text-muted-foreground">{new Date(n.created_at).toLocaleString("fr-FR")}
                <button aria-label="Delete note" onClick={() => run(() => deleteNote(id, n.id))}><Trash2 className="h-3.5 w-3.5" /></button></p>
            </li>
          ))}
        </ul>
      </Card>
      {msg && <p role="status" className="text-sm text-muted-foreground print:hidden">{msg}</p>}
    </>
  );
}

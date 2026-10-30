import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/backend/admin";
import { apptLabel, sendTemplated } from "@/lib/email";
import { nowInMorocco } from "@/lib/slots";

export const dynamic = "force-dynamic";

// Called daily by Vercel Cron (see vercel.json): reminds clients of tomorrow's confirmed/pending appointments.
export async function GET(req: Request) {
  if (!process.env.CRON_SECRET || req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const sb = createAdminClient();
  const t = new Date(nowInMorocco().date + "T00:00:00Z");
  t.setUTCDate(t.getUTCDate() + 1);
  const tomorrow = t.toISOString().slice(0, 10);

  const { data } = await sb.from("appointments")
    .select("id,date,start_time,end_time,project_requests(reference,client_name,email)")
    .eq("date", tomorrow).in("status", ["pending", "confirmed"]).eq("reminder_sent", false);

  let sent = 0;
  for (const a of data ?? []) {
    const r = a.project_requests as unknown as { reference: string; client_name: string; email: string } | null;
    if (!r) continue;
    const res = await sendTemplated("appointment_reminder", r.email, { reference: r.reference, name: r.client_name, appointment: apptLabel(a.date, a.start_time, a.end_time) });
    if (res.ok) { await sb.from("appointments").update({ reminder_sent: true }).eq("id", a.id); sent++; }
  }
  return NextResponse.json({ sent });
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from "next/link";
import { createClient } from "@/lib/backend/server";
import { buttonClass, Card } from "@/components/ui";
import { cn } from "@/lib/utils";
import { nowInMorocco } from "@/lib/slots";
import { StatusBadge } from "../../_components/status";
import AppointmentActions from "./appointment-actions";

export const dynamic = "force-dynamic";

type SP = { view?: string; date?: string; status?: string };
const iso = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (d: Date, n: number) => { const x = new Date(d); x.setUTCDate(x.getUTCDate() + n); return x; };

export default async function AppointmentsPage({ searchParams: sp }: { searchParams: SP }) {
  const sb = createClient();
  const view = ["month", "week", "day", "list"].includes(sp.view ?? "") ? sp.view! : "month";
  const anchor = new Date((/^\d{4}-\d{2}-\d{2}$/.test(sp.date ?? "") ? sp.date! : nowInMorocco().date) + "T00:00:00Z");

  let from = anchor, to = anchor;
  if (view === "month") { from = new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth(), 1)); to = new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth() + 1, 0)); }
  if (view === "week") { from = addDays(anchor, -((anchor.getUTCDay() + 6) % 7)); to = addDays(from, 6); }

  let q = sb.from("appointments").select("*, project_requests(id,reference,client_name,business_name,phone)").order("date").order("start_time");
  if (view === "list") q = q.gte("date", nowInMorocco().date).limit(200); else q = q.gte("date", iso(from)).lte("date", iso(to));
  if (sp.status) q = q.eq("status", sp.status);
  const { data } = await q;
  const appts = (data ?? []) as any[];
  const byDay = new Map<string, any[]>();
  appts.forEach((a) => byDay.set(a.date, [...(byDay.get(a.date) ?? []), a]));

  const link = (o: Partial<SP>) => `/admin/appointments?${new URLSearchParams(Object.entries({ view, date: iso(anchor), ...o }).filter(([, v]) => v) as [string, string][])}`;
  const step = view === "month" ? () => new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth() + 1, 1)) : () => addDays(anchor, view === "week" ? 7 : 1);
  const prev = view === "month" ? new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth() - 1, 1)) : addDays(anchor, view === "week" ? -7 : -1);
  const title = view === "month" ? anchor.toLocaleDateString("en", { month: "long", year: "numeric", timeZone: "UTC" }) : view === "week" ? `${iso(from)} → ${iso(to)}` : view === "day" ? iso(anchor) : "Upcoming";

  const Item = ({ a }: { a: any }) => (
    <li className="rounded-xl border border-border bg-card p-3 text-sm">
      <div className="flex items-start justify-between gap-2">
        <div><p className="font-medium">{a.start_time.slice(0, 5)}–{a.end_time.slice(0, 5)} · <Link href={`/admin/requests/${a.project_requests?.id}`} className="text-accent hover:underline">{a.project_requests?.client_name}</Link></p>
          <p className="text-xs capitalize text-muted-foreground">{a.project_requests?.reference} · {a.meeting_type.replace("_", " ")}{a.project_requests?.phone ? ` · ${a.project_requests.phone}` : ""}</p></div>
        <StatusBadge status={a.status} />
      </div>
      <div className="mt-2"><AppointmentActions id={a.id} status={a.status} date={a.date} start={a.start_time.slice(0, 5)} /></div>
    </li>
  );

  const days: Date[] = view === "month" ? Array.from({ length: to.getUTCDate() }, (_, i) => addDays(from, i)) : view === "week" ? Array.from({ length: 7 }, (_, i) => addDays(from, i)) : view === "day" ? [anchor] : [];
  const lead = view === "month" ? (from.getUTCDay() + 6) % 7 : 0;
  const today = nowInMorocco().date;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Appointments</h1>
        <div className="flex flex-wrap gap-2">
          {["month", "week", "day", "list"].map((v) => (<Link key={v} href={link({ view: v })} className={buttonClass(view === v ? "primary" : "outline", "capitalize !px-4 !py-2")}>{v}</Link>))}
          <Link href="/admin/availability" className={buttonClass("outline", "!px-4 !py-2")}>Availability settings</Link>
        </div>
      </div>

      {view !== "list" && (
        <div className="mb-4 flex items-center gap-2">
          <Link href={link({ date: iso(prev) })} className={buttonClass("outline", "!px-3 !py-1.5")}>←</Link>
          <span className="min-w-40 text-center font-semibold capitalize">{title}</span>
          <Link href={link({ date: iso(step()) })} className={buttonClass("outline", "!px-3 !py-1.5")}>→</Link>
          <Link href={link({ date: today })} className={buttonClass("ghost", "!px-3 !py-1.5")}>Today</Link>
        </div>
      )}

      {view === "month" && (
        <Card className="overflow-x-auto">
          <div className="grid min-w-[720px] grid-cols-7 text-xs">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (<div key={d} className="border-b border-border bg-muted/50 p-2 font-medium">{d}</div>))}
            {Array.from({ length: lead }).map((_, i) => (<div key={`l${i}`} className="min-h-24 border-b border-e border-border bg-muted/20" />))}
            {days.map((d) => {
              const key = iso(d); const list = byDay.get(key) ?? [];
              return (
                <Link key={key} href={link({ view: "day", date: key })} className={cn("min-h-24 border-b border-e border-border p-2 hover:bg-muted/40", key === today && "bg-accent/5")}>
                  <span className={cn("mb-1 inline-block text-xs font-semibold", key === today && "rounded-full bg-accent px-1.5 text-white")}>{d.getUTCDate()}</span>
                  {list.slice(0, 3).map((a) => (<p key={a.id} className={cn("truncate rounded px-1 text-[11px]", a.status === "confirmed" ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300" : a.status === "cancelled" ? "bg-zinc-200 text-zinc-600 line-through dark:bg-zinc-800" : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300")}>{a.start_time.slice(0, 5)} {a.project_requests?.client_name}</p>))}
                  {list.length > 3 && <p className="text-[11px] text-muted-foreground">+{list.length - 3} more</p>}
                </Link>
              );
            })}
          </div>
        </Card>
      )}

      {(view === "week" || view === "day") && (
        <div className={cn("grid gap-4", view === "week" && "lg:grid-cols-2")}>
          {days.map((d) => (
            <div key={iso(d)}>
              <h2 className="mb-2 text-sm font-semibold">{d.toLocaleDateString("en", { weekday: "long", day: "numeric", month: "short", timeZone: "UTC" })}</h2>
              <ul className="space-y-2">{(byDay.get(iso(d)) ?? []).map((a) => (<Item key={a.id} a={a} />))}{!byDay.get(iso(d)) && <li className="text-sm text-muted-foreground">No appointments</li>}</ul>
            </div>
          ))}
        </div>
      )}

      {view === "list" && (
        <ul className="space-y-2">
          {appts.map((a) => (<div key={a.id}><p className="mb-1 mt-3 text-xs font-semibold text-muted-foreground">{a.date}</p><Item a={a} /></div>))}
          {!appts.length && <p className="py-10 text-center text-muted-foreground">No upcoming appointments.</p>}
        </ul>
      )}
    </div>
  );
}

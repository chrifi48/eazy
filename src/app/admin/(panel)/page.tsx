/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from "next/link";
import { createClient } from "@/lib/backend/server";
import { Card } from "@/components/ui";
import { formatMoney } from "@/lib/format";
import { nowInMorocco } from "@/lib/slots";
import { StatusBadge } from "../_components/status";
import StatCards from "../_components/stat-cards";
import { Charts } from "../_components/charts";

export const dynamic = "force-dynamic";
const WON = ["won", "in_progress", "delivered"];

export default async function Dashboard() {
  const sb = createClient();
  const today = nowInMorocco().date;
  const monthStart = today.slice(0, 7) + "-01";
  const since = new Date(); since.setMonth(since.getMonth() - 5); since.setDate(1);

  const [{ data: reqs }, { data: upcoming }, { data: latest }, { data: cats }] = await Promise.all([
    sb.from("project_requests").select("id,status,created_at,category_id,estimated_min,estimated_max,final_price").limit(5000),
    sb.from("appointments").select("id,date,start_time,end_time,status,meeting_type,project_requests(id,reference,client_name)").gte("date", today).in("status", ["pending", "confirmed"]).order("date").order("start_time").limit(5),
    sb.from("project_requests").select("id,reference,client_name,business_name,status,created_at,estimated_min,estimated_max").order("created_at", { ascending: false }).limit(5),
    sb.from("categories").select("id,name_fr"),
  ]);
  const all = reqs ?? [];
  const { count: upcomingCount } = await sb.from("appointments").select("id", { count: "exact", head: true }).gte("date", today).in("status", ["pending", "confirmed"]);

  const won = all.filter((r) => WON.includes(r.status));
  const revenue = won.reduce((s, r) => s + Number(r.final_price ?? (Number(r.estimated_min) + Number(r.estimated_max)) / 2), 0);
  const stats = [
    { label: "New requests", value: all.filter((r) => r.status === "new").length },
    { label: "Upcoming appointments", value: upcomingCount ?? 0 },
    { label: "Requests this month", value: all.filter((r) => r.created_at >= monthStart).length },
    { label: "Conversion rate", value: all.length ? Math.round((won.length / all.length) * 100) : 0, suffix: "%" },
    { label: "Revenue (won projects)", value: formatMoney(revenue, "fr") },
  ];

  const months: { month: string; requests: number }[] = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(since.getFullYear(), since.getMonth() + i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    months.push({ month: d.toLocaleDateString("en", { month: "short" }), requests: all.filter((r) => r.created_at.startsWith(key)).length });
  }
  const catCount = new Map<string, number>();
  all.forEach((r) => r.category_id && catCount.set(r.category_id, (catCount.get(r.category_id) ?? 0) + 1));
  const topCats = [...catCount.entries()].map(([id, n]) => ({ name: cats?.find((c) => c.id === id)?.name_fr ?? "?", requests: n })).sort((a, b) => b.requests - a.requests).slice(0, 6);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <StatCards stats={stats} />
      <Charts months={months} cats={topCats} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <div className="mb-3 flex justify-between"><h2 className="font-semibold">Next appointments</h2><Link href="/admin/appointments" className="text-sm text-accent">All</Link></div>
          <ul className="divide-y divide-border text-sm">
            {(upcoming ?? []).map((a: any) => (
              <li key={a.id} className="flex items-center justify-between py-2.5">
                <div><Link href={`/admin/requests/${a.project_requests?.id}`} className="font-medium hover:text-accent">{a.project_requests?.client_name}</Link><p className="text-xs text-muted-foreground">{a.project_requests?.reference} · {a.meeting_type}</p></div>
                <div className="text-end"><p>{a.date}</p><p className="text-xs text-muted-foreground">{a.start_time.slice(0, 5)}</p></div>
              </li>
            ))}
            {!upcoming?.length && <li className="py-6 text-center text-muted-foreground">No upcoming appointments</li>}
          </ul>
        </Card>
        <Card className="p-5">
          <div className="mb-3 flex justify-between"><h2 className="font-semibold">Latest requests</h2><Link href="/admin/requests" className="text-sm text-accent">All</Link></div>
          <ul className="divide-y divide-border text-sm">
            {(latest ?? []).map((r: any) => (
              <li key={r.id} className="flex items-center justify-between gap-2 py-2.5">
                <div><Link href={`/admin/requests/${r.id}`} className="font-medium hover:text-accent">{r.client_name}</Link><p className="text-xs text-muted-foreground">{r.reference} · {r.business_name || "—"}</p></div>
                <StatusBadge status={r.status} />
              </li>
            ))}
            {!latest?.length && <li className="py-6 text-center text-muted-foreground">No requests yet</li>}
          </ul>
        </Card>
      </div>
    </div>
  );
}

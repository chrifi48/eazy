/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from "next/link";
import { Download } from "lucide-react";
import { createClient } from "@/lib/backend/server";
import { Button, buttonClass, Card, Input, Select } from "@/components/ui";
import { formatRange } from "@/lib/format";
import { applyRequestFilters, REQUEST_SELECT, type ReqSearch } from "@/lib/request-query";
import { StatusBadge, STATUSES } from "../../_components/status";

export const dynamic = "force-dynamic";
const PAGE = 15;

export default async function RequestsPage({ searchParams: sp }: { searchParams: ReqSearch }) {
  const sb = createClient();
  const page = Math.max(1, Number(sp.page) || 1);
  const [{ data: cats }, { data: types }] = await Promise.all([sb.from("categories").select("id,name_fr").order("sort_order"), sb.from("project_types").select("id,name_fr").order("sort_order")]);
  const { data: rows, count } = await applyRequestFilters(sb.from("project_requests").select(REQUEST_SELECT, { count: "exact" }), sp).range((page - 1) * PAGE, page * PAGE - 1);
  const pages = Math.max(1, Math.ceil((count ?? 0) / PAGE));

  const url = (o: Partial<ReqSearch>) => `/admin/requests?${new URLSearchParams(Object.entries({ ...sp, ...o }).filter(([, v]) => v) as [string, string][])}`;
  const sortLink = (col: string, label: string) => (
    <Link href={url({ sort: col, dir: sp.sort === col && sp.dir !== "asc" ? "asc" : "desc", page: "1" })} className="hover:text-accent">{label}{sp.sort === col || (!sp.sort && col === "created_at") ? (sp.dir === "asc" ? " ↑" : " ↓") : ""}</Link>
  );
  const exportQs = new URLSearchParams(Object.entries({ ...sp, page: "" }).filter(([, v]) => v) as [string, string][]);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Project requests <span className="text-base font-normal text-muted-foreground">({count ?? 0})</span></h1>
        <a href={`/admin/requests/export?${exportQs}`} className={buttonClass("outline")}><Download className="h-4 w-4" />Export CSV / Excel</a>
      </div>

      <form className="mb-6 grid gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-6">
        <Input name="q" defaultValue={sp.q} placeholder="Search name, business, ref, email…" className="lg:col-span-2" />
        <Select name="status" defaultValue={sp.status ?? ""}><option value="">All statuses</option>{STATUSES.map(([k, l]) => (<option key={k} value={k}>{l}</option>))}</Select>
        <Select name="category" defaultValue={sp.category ?? ""}><option value="">All categories</option>{cats?.map((c) => (<option key={c.id} value={c.id}>{c.name_fr}</option>))}</Select>
        <Select name="type" defaultValue={sp.type ?? ""}><option value="">All types</option>{types?.map((c) => (<option key={c.id} value={c.id}>{c.name_fr}</option>))}</Select>
        <div className="flex gap-2"><Input name="from" type="date" defaultValue={sp.from} aria-label="From" /><Input name="to" type="date" defaultValue={sp.to} aria-label="To" /></div>
        <div className="flex gap-2 sm:col-span-2 lg:col-span-6"><Button>Filter</Button><Link href="/admin/requests" className={buttonClass("outline")}>Reset</Link></div>
      </form>

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[960px] text-sm">
          <thead className="border-b border-border bg-muted/50"><tr className="text-start">
            <th className="p-3 text-start font-medium">{sortLink("reference", "Reference")}</th><th className="p-3 text-start font-medium">{sortLink("client_name", "Client")}</th>
            <th className="p-3 text-start font-medium">Business</th><th className="p-3 text-start font-medium">Category</th><th className="p-3 text-start font-medium">Model</th>
            <th className="p-3 text-start font-medium">{sortLink("estimated_max", "Estimate")}</th><th className="p-3 text-start font-medium">Appointment</th>
            <th className="p-3 text-start font-medium">{sortLink("status", "Status")}</th><th className="p-3 text-start font-medium">{sortLink("created_at", "Created")}</th>
          </tr></thead>
          <tbody>
            {(rows ?? []).map((r: any) => {
              const a = r.appointments?.find((x: any) => ["pending", "confirmed"].includes(x.status)) ?? r.appointments?.[0];
              return (
                <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="p-3 font-medium"><Link href={`/admin/requests/${r.id}`} className="text-accent hover:underline">{r.reference}</Link></td>
                  <td className="p-3">{r.client_name}</td><td className="p-3">{r.business_name || "—"}</td><td className="p-3">{r.categories?.name_fr ?? "—"}</td>
                  <td className="p-3">{r.custom_design ? "Custom" : r.templates?.name_fr ?? "—"}</td>
                  <td className="whitespace-nowrap p-3">{formatRange(Number(r.estimated_min), Number(r.estimated_max))}</td>
                  <td className="whitespace-nowrap p-3">{a ? `${a.date} ${a.start_time.slice(0, 5)}` : "—"}</td>
                  <td className="p-3"><StatusBadge status={r.status} /></td>
                  <td className="whitespace-nowrap p-3">{r.created_at.slice(0, 10)}</td>
                </tr>
              );
            })}
            {!rows?.length && <tr><td colSpan={9} className="p-8 text-center text-muted-foreground">No requests found.</td></tr>}
          </tbody>
        </table>
      </Card>

      {pages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3 text-sm">
          {page > 1 && <Link href={url({ page: String(page - 1) })} className={buttonClass("outline")}>Previous</Link>}
          <span className="text-muted-foreground">{page} / {pages}</span>
          {page < pages && <Link href={url({ page: String(page + 1) })} className={buttonClass("outline")}>Next</Link>}
        </div>
      )}
    </div>
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from "next/link";
import { notFound } from "next/navigation";
import { Mail, MessageCircle, Phone } from "lucide-react";
import { createClient } from "@/lib/backend/server";
import { buttonClass, Card } from "@/components/ui";
import { formatMoney, formatRange } from "@/lib/format";
import { whatsappLink } from "@/lib/data";
import { StatusBadge } from "../../../_components/status";
import RequestPanel from "./request-panel";
import PrintButton from "./print-button";
import AppointmentActions from "../../appointments/appointment-actions";

export const dynamic = "force-dynamic";

export default async function RequestDetail({ params }: { params: { id: string } }) {
  const sb = createClient();
  const { data: r } = await sb.from("project_requests")
    .select("*, categories(name_fr), templates(name_fr,slug), project_types(name_fr), packages(name_fr,price), request_features(price_min,price_max,features(name_fr)), request_files(id,file_url,file_name), appointments(*)")
    .eq("id", params.id).single();
  if (!r) notFound();
  const { data: notes } = await sb.from("request_notes").select("*").eq("request_id", r.id).order("created_at", { ascending: false });

  // uploaded files live in a private bucket -> short-lived signed links
  const files = await Promise.all((r.request_files ?? []).map(async (f: any) => ({
    ...f, url: `/api/files/request-files/${f.file_url}`,
  })));

  const appts = [...(r.appointments ?? [])].sort((a: any, b: any) => (b.date + b.start_time).localeCompare(a.date + a.start_time));
  const phone = (r.phone || r.whatsapp || "").replace(/\s/g, "");
  const row = (k: string, v: React.ReactNode) => (<div className="flex justify-between gap-4 py-2"><dt className="text-muted-foreground">{k}</dt><dd className="text-end font-medium">{v || "—"}</dd></div>);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/admin/requests" className="text-sm text-muted-foreground print:hidden">← Requests</Link>
          <h1 className="mt-1 text-2xl font-bold">{r.reference} <StatusBadge status={r.status} /></h1>
          <p className="text-sm text-muted-foreground">Created {r.created_at.slice(0, 16).replace("T", " ")}</p>
        </div>
        <div className="flex flex-wrap gap-2 print:hidden">
          {phone && <a href={`tel:${phone}`} className={buttonClass("outline")}><Phone className="h-4 w-4" />Call</a>}
          {(r.whatsapp || r.phone) && <a href={whatsappLink(r.whatsapp || r.phone, `Bonjour ${r.client_name}, concernant votre demande ${r.reference}`)} target="_blank" rel="noopener noreferrer" className={buttonClass("outline")}><MessageCircle className="h-4 w-4" />WhatsApp</a>}
          <a href={`mailto:${r.email}?subject=${encodeURIComponent("Votre demande " + r.reference)}`} className={buttonClass("outline")}><Mail className="h-4 w-4" />Email</a>
          <PrintButton />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="p-5"><h2 className="mb-2 font-semibold">Client</h2>
            <dl className="divide-y divide-border text-sm">
              {row("Name", r.client_name)}{row("Business", r.business_name)}{row("Sector", r.sector)}{row("Location", [r.city, r.country].filter(Boolean).join(", "))}
              {row("Email", r.email)}{row("Phone", r.phone)}{row("WhatsApp", r.whatsapp)}{row("Language", r.language?.toUpperCase())}{row("Deadline", r.deadline)}{row("Budget", r.budget_range)}
            </dl>
            {r.description && <p className="mt-4 whitespace-pre-line rounded-xl bg-muted p-4 text-sm">{r.description}</p>}
          </Card>

          <Card className="p-5"><h2 className="mb-2 font-semibold">Project</h2>
            <dl className="divide-y divide-border text-sm">
              {row("Type", r.project_types?.name_fr)}{row("Category", r.categories?.name_fr)}
              {row("Model", r.custom_design ? "Custom design" : r.templates ? <Link className="text-accent" href={`/fr/models/${r.templates.slug}`} target="_blank">{r.templates.name_fr}</Link> : null)}
              {row("Package", r.packages ? `${r.packages.name_fr} — ${formatMoney(Number(r.packages.price))}` : null)}
              {row("Estimate", formatRange(Number(r.estimated_min), Number(r.estimated_max)))}{row("Estimated delivery", `${r.estimated_days} days`)}
            </dl>
            <h3 className="mb-1 mt-4 text-sm font-semibold">Selected features</h3>
            <ul className="divide-y divide-border text-sm">
              {(r.request_features ?? []).map((f: any, i: number) => (<li key={i} className="flex justify-between py-1.5"><span>{f.features?.name_fr ?? "(removed)"}</span><span className="text-muted-foreground">{formatRange(Number(f.price_min), Number(f.price_max))}</span></li>))}
              {!r.request_features?.length && <li className="py-1.5 text-muted-foreground">None</li>}
            </ul>
          </Card>

          {files.length > 0 && (
            <Card className="p-5 print:hidden"><h2 className="mb-2 font-semibold">Uploaded files</h2>
              <ul className="space-y-1 text-sm">{files.map((f: any) => (<li key={f.id}>{f.url ? <a href={f.url} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">{f.file_name}</a> : f.file_name}</li>))}</ul>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="p-5"><h2 className="mb-2 font-semibold">Appointment</h2>
            {appts.length === 0 && <p className="text-sm text-muted-foreground">None</p>}
            {appts.map((a: any) => (
              <div key={a.id} className="border-t border-border py-3 first:border-0 first:pt-0">
                <div className="flex items-center justify-between"><p className="font-medium">{a.date} · {a.start_time.slice(0, 5)}–{a.end_time.slice(0, 5)}</p><StatusBadge status={a.status} /></div>
                <p className="mb-2 text-xs capitalize text-muted-foreground">{a.meeting_type.replace("_", " ")}</p>
                <AppointmentActions id={a.id} status={a.status} date={a.date} start={a.start_time.slice(0, 5)} />
              </div>
            ))}
          </Card>
          <RequestPanel id={r.id} status={r.status} payments={{ final_price: r.final_price ?? "", deposit_amount: r.deposit_amount ?? "", deposit_paid: r.deposit_paid, final_paid: r.final_paid }} notes={notes ?? []} />
        </div>
      </div>
    </div>
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import { notFound } from "next/navigation";
import { createClient } from "@/lib/backend/server";
import { bySlug, labelColumn, type Opt } from "../../crud/config";
import CrudManager from "../../crud/crud-manager";

export const dynamic = "force-dynamic";

export default async function ResourcePage({ params }: { params: { resource: string } }) {
  const res = bySlug(params.resource);
  if (!res) notFound();
  const sb = createClient();

  const { data: rows } = await sb.from(res.table).select("*").order(res.ordered ? "sort_order" : "created_at", { ascending: true });

  // option lists for selects / multi-selects / relation columns
  const tables = new Set<string>();
  res.fields.forEach((f) => { if ((f.kind === "select" || f.kind === "multi") && f.optionsFrom) tables.add(f.optionsFrom); });
  res.columns.forEach((c) => c.optionsFrom && tables.add(c.optionsFrom));
  const options: Record<string, Opt[]> = {};
  await Promise.all([...tables].map(async (t) => {
    const col = labelColumn[t] ?? "name_fr";
    const { data } = await sb.from(t).select(`id, ${col}`).order("sort_order");
    options[t] = (data ?? []).map((r: any) => ({ value: r.id, label: r[col] }));
  }));

  // join-table values: { fieldName: { rowId: [otherIds] } }
  const multi: Record<string, Record<string, string[]>> = {};
  await Promise.all(res.fields.filter((f) => f.kind === "multi").map(async (f: any) => {
    const { data } = await sb.from(f.table).select("*");
    const m: Record<string, string[]> = {};
    (data ?? []).forEach((r: any) => { (m[r[f.key]] ??= []).push(r[f.other]); });
    multi[f.name] = m;
  }));

  const galleries: Record<string, { image_url: string; device: string }[]> = {};
  if (res.fields.some((f) => f.kind === "gallery")) {
    const { data } = await sb.from("template_images").select("*").order("sort_order");
    (data ?? []).forEach((r: any) => { (galleries[r.template_id] ??= []).push({ image_url: r.image_url, device: r.device }); });
  }

  return <CrudManager resource={res} rows={rows ?? []} options={options} multi={multi} galleries={galleries} />;
}

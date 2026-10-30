"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, GripVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { Button, Card, Input, Select, Textarea } from "@/components/ui";
import { cn } from "@/lib/utils";
import { ImageField, MultiImageField } from "../_components/upload";
import { deleteRecord, moveRecord, reorderRecords, saveRecord } from "./actions";
import type { FieldDef, Opt, Resource } from "./config";

const LOCALES: [string, string][] = [["fr", "Français"], ["ar", "العربية"], ["en", "English"]];

function toForm(res: Resource, row: any | null, multi: Record<string, Record<string, string[]>>, galleries: Record<string, any[]>) {
  const v: Record<string, any> = {};
  const m: Record<string, string[]> = {};
  for (const f of res.fields) {
    if (f.kind === "i18n") LOCALES.forEach(([l]) => (v[`${f.name}_${l}`] = row?.[`${f.name}_${l}`] ?? ""));
    else if (f.kind === "lines") LOCALES.forEach(([l]) => (v[`${f.name}_${l}`] = (row?.[`${f.name}_${l}`] ?? []).join("\n")));
    else if (f.kind === "list") v[f.name] = (row?.[f.name] ?? []).join("\n");
    else if (f.kind === "images") v[f.name] = row?.[f.name] ?? [];
    else if (f.kind === "bool") v[f.name] = row ? Boolean(row[f.name]) : f.name === "is_active" || f.name === "is_published" ? f.name === "is_active" : false;
    else if (f.kind === "multi") m[f.name] = row ? multi[f.name]?.[row.id] ?? [] : [];
    else if (f.kind === "gallery") v.gallery = row ? galleries[row.id] ?? [] : [];
    else v[f.name] = row?.[f.name] ?? (f.kind === "number" ? (f.name === "rating" ? 5 : f.name === "delivery_days" ? 14 : 0) : f.kind === "select" && f.name === "kind" ? "project" : f.kind === "select" && f.name === "billing_type" ? "one_time" : "");
  }
  return { v, m };
}

export default function CrudManager({ resource: res, rows, options, multi, galleries }: { resource: Resource; rows: any[]; options: Record<string, Opt[]>; multi: Record<string, Record<string, string[]>>; galleries: Record<string, any[]> }) {
  const router = useRouter();
  const [editing, setEditing] = useState<any | "new" | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [mf, setMf] = useState<Record<string, string[]>>({});
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const [list, setList] = useState<any[]>(rows);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  useEffect(() => setList(rows), [rows]);

  // drag & drop: reorder locally right away, then save the new order
  const drop = (targetId: string) => {
    if (!dragId || dragId === targetId) return;
    const next = [...list];
    const from = next.findIndex((r) => r.id === dragId), to = next.findIndex((r) => r.id === targetId);
    next.splice(to, 0, next.splice(from, 1)[0]);
    setList(next); setDragId(null); setOverId(null);
    start(async () => { const r = await reorderRecords(res.key, next.map((x) => x.id)); if (r.error) alert(r.error); router.refresh(); });
  };

  const open = (row: any | "new") => {
    const { v, m } = toForm(res, row === "new" ? null : row, multi, galleries);
    setForm(v); setMf(m); setEditing(row); setError("");
    setTimeout(() => document.getElementById("crud-form")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };
  const set = (name: string, value: any) => setForm((f) => ({ ...f, [name]: value }));

  const save = () => start(async () => {
    setError("");
    const r = await saveRecord({ key: res.key, id: editing === "new" ? null : editing.id, values: form, multi: mf, gallery: form.gallery });
    if (r.error) return setError(r.error);
    setEditing(null); router.refresh();
  });
  const remove = (row: any) => {
    if (!confirm("Delete this item? This cannot be undone.")) return;
    start(async () => { const r = await deleteRecord(res.key, row.id); if (r.error) alert(r.error); else router.refresh(); });
  };
  const move = (row: any, dir: "up" | "down") => start(async () => { await moveRecord(res.key, row.id, dir); router.refresh(); });

  const cell = (row: any, c: Resource["columns"][number]) => {
    const val = row[c.name];
    if (c.type === "bool") return <span className={cn("rounded-full px-2 py-0.5 text-xs", val ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300" : "bg-muted text-muted-foreground")}>{val ? "Yes" : "No"}</span>;
    if (c.type === "price") return `${Number(val).toLocaleString("fr-FR")} MAD`;
    if (c.type === "image") return val ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={val} alt="" className="h-10 w-14 rounded object-cover" /> : null;
    if (c.type === "rel") return options[c.optionsFrom!]?.find((o) => o.value === val)?.label ?? "—";
    return val ?? "—";
  };

  const renderField = (f: FieldDef) => {
    const wide = f.kind === "i18n" || f.kind === "lines" || f.kind === "list" || f.kind === "gallery" || f.kind === "images" || f.kind === "multi" || f.kind === "textarea";
    const label = <span className="mb-1 block text-sm font-medium">{f.label}{"required" in f && f.required ? " *" : ""}</span>;
    let body: React.ReactNode = null;
    switch (f.kind) {
      case "text": case "url": body = <Input type={f.kind === "url" ? "url" : "text"} value={form[f.name] ?? ""} onChange={(e) => set(f.name, e.target.value)} />; break;
      case "textarea": body = <Textarea value={form[f.name] ?? ""} onChange={(e) => set(f.name, e.target.value)} />; break;
      case "number": body = <Input type="number" step="any" value={form[f.name] ?? ""} onChange={(e) => set(f.name, e.target.value)} />; break;
      case "bool": return (
        <label key={f.name} className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={!!form[f.name]} onChange={(e) => set(f.name, e.target.checked)} className="h-4 w-4 accent-[#F97316]" />{f.label}</label>
      );
      case "select": {
        const opts = f.options ?? options[f.optionsFrom!] ?? [];
        body = (<Select value={form[f.name] ?? ""} onChange={(e) => set(f.name, e.target.value)}>{(f.nullable || !f.options) && <option value="">{f.nullable ? "— none —" : "— choose —"}</option>}{opts.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}</Select>);
        break;
      }
      case "i18n": case "lines":
        body = (
          <div className="grid gap-3 md:grid-cols-3">
            {LOCALES.map(([l, name]) => {
              const k = `${f.name}_${l}`;
              const area = f.kind === "lines" || ("textarea" in f && f.textarea);
              return (
                <label key={l} className="block text-xs text-muted-foreground">{name}
                  {area ? <Textarea dir={l === "ar" ? "rtl" : "ltr"} rows={f.kind === "lines" ? 5 : 4} value={form[k] ?? ""} onChange={(e) => set(k, e.target.value)} className="mt-1" /> : <Input dir={l === "ar" ? "rtl" : "ltr"} value={form[k] ?? ""} onChange={(e) => set(k, e.target.value)} className="mt-1" />}
                </label>
              );
            })}
          </div>
        );
        break;
      case "list": body = <Textarea rows={4} value={form[f.name] ?? ""} onChange={(e) => set(f.name, e.target.value)} />; break;
      case "image": body = <ImageField value={form[f.name] ?? ""} onChange={(v) => set(f.name, v)} folder={res.table} />; break;
      case "images": body = <MultiImageField items={(form[f.name] ?? []).map((u: string) => ({ image_url: u }))} onChange={(a) => set(f.name, a.map((x) => x.image_url))} folder={res.table} />; break;
      case "gallery": body = <MultiImageField devices items={form.gallery ?? []} onChange={(a) => set("gallery", a)} folder="templates" />; break;
      case "multi": {
        const opts = options[f.optionsFrom] ?? [];
        body = (
          <div className="flex flex-wrap gap-2">
            {opts.map((o) => {
              const on = (mf[f.name] ?? []).includes(o.value);
              return (<label key={o.value} className={cn("cursor-pointer rounded-full border px-3 py-1 text-sm", on ? "border-accent bg-accent/10" : "border-border")}>
                <input type="checkbox" className="sr-only" checked={on} onChange={() => setMf((m) => ({ ...m, [f.name]: on ? m[f.name].filter((x) => x !== o.value) : [...(m[f.name] ?? []), o.value] }))} />{o.label}</label>);
            })}
          </div>
        );
        break;
      }
    }
    const Wrap = (["text", "url", "textarea", "number", "select", "list"].includes(f.kind) ? "label" : "div") as "label";
    return (
      <Wrap key={f.name} className={cn("block", wide && "md:col-span-2")}>
        {label}
        {"hint" in f && f.hint && <span className="mb-1 block text-xs text-muted-foreground">{f.hint}</span>}
        {body}
      </Wrap>
    );
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{res.title}</h1>
        <Button onClick={() => open("new")}><Plus className="h-4 w-4" />New</Button>
      </div>

      {editing && (
        <Card className="mb-8 scroll-mt-4 p-5" id="crud-form">
          <h2 className="mb-4 text-lg font-semibold">{editing === "new" ? "New" : "Edit"}</h2>
          <div className="grid gap-4 md:grid-cols-2">{res.fields.map(renderField)}</div>
          {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{error}</p>}
          <div className="mt-5 flex gap-2">
            <Button onClick={save} disabled={pending}>{pending ? "Saving…" : "Save"}</Button>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
          </div>
        </Card>
      )}

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="border-b border-border bg-muted/50 text-start"><tr>
            {res.ordered && <th className="w-20 p-3 text-start font-medium">Order</th>}
            {res.columns.map((c) => (<th key={c.name} className="p-3 text-start font-medium">{c.label}</th>))}
            <th className="w-28 p-3" />
          </tr></thead>
          <tbody>
            {list.map((row, i) => (
              <tr key={row.id} draggable={!!res.ordered} onDragStart={(e) => { setDragId(row.id); e.dataTransfer.effectAllowed = "move"; }} onDragOver={(e) => { if (dragId) { e.preventDefault(); setOverId(row.id); } }} onDrop={(e) => { e.preventDefault(); drop(row.id); }} onDragEnd={() => { setDragId(null); setOverId(null); }}
                className={cn("border-b border-border last:border-0 hover:bg-muted/30", dragId === row.id && "opacity-40", overId === row.id && dragId !== row.id && "bg-accent/10 outline outline-1 outline-accent")}>
                {res.ordered && (
                  <td className="p-3"><div className="flex items-center gap-1">
                    <span className="cursor-grab text-muted-foreground active:cursor-grabbing" title="Drag to reorder" aria-hidden><GripVertical className="h-4 w-4" /></span>
                    <button disabled={pending || i === 0} onClick={() => move(row, "up")} aria-label="Move up" className="rounded border border-border p-1 hover:bg-muted disabled:opacity-30"><ArrowUp className="h-3 w-3" /></button>
                    <button disabled={pending || i === list.length - 1} onClick={() => move(row, "down")} aria-label="Move down" className="rounded border border-border p-1 hover:bg-muted disabled:opacity-30"><ArrowDown className="h-3 w-3" /></button>
                  </div></td>
                )}
                {res.columns.map((c) => (<td key={c.name} className="p-3">{cell(row, c)}</td>))}
                <td className="p-3"><div className="flex justify-end gap-1">
                  <button onClick={() => open(row)} aria-label="Edit" className="rounded-lg border border-border p-2 hover:bg-muted"><Pencil className="h-3.5 w-3.5" /></button>
                  <button onClick={() => remove(row)} aria-label="Delete" className="rounded-lg border border-border p-2 text-red-600 hover:bg-muted"><Trash2 className="h-3.5 w-3.5" /></button>
                </div></td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={res.columns.length + 2} className="p-8 text-center text-muted-foreground">Nothing yet. Click “New”.</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useTransition } from "react";
import { Button, Card, Input, Textarea } from "@/components/ui";
import { ImageField } from "../../_components/upload";
import RichText from "../../_components/rich-text";
import { saveSetting } from "./actions";

// browser-safe: old plain-text values become paragraphs; HTML passes through (the server sanitizes on save)
const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!);
const toHtml = (v: string) => (!v || /^\s*</.test(v) ? v : v.split(/\n{2,}/).map((p) => `<p>${esc(p).replace(/\n/g, "<br>")}</p>`).join(""));

type F = { path: string; label: string; type?: "text" | "textarea" | "color" | "image" | "bool" | "number" | "rich"; placeholder?: string; rtl?: boolean };
type Section = { key: string; title: string; hint?: string; scalar?: boolean; fields: F[] };

const i18n = (base: string, label: string, type: F["type"] = "text"): F[] => [["fr", "FR"], ["ar", "AR"], ["en", "EN"]].map(([l, n]) => ({ path: `${base}_${l}`, label: `${label} (${n})`, type, rtl: l === "ar" }));

const PAGES = ["home", "models", "pricing", "portfolio", "about", "contact"];

const sections: Section[] = [
  { key: "brand", title: "Brand", fields: [{ path: "name", label: "Site name" }, { path: "primary", label: "Primary color", type: "color" }, { path: "accent", label: "Accent color", type: "color" }, { path: "logo", label: "Logo", type: "image" }, { path: "favicon", label: "Favicon", type: "image" }] },
  { key: "contact", title: "Contact info", fields: [{ path: "email", label: "Email" }, { path: "phone", label: "Phone" }, { path: "whatsapp", label: "WhatsApp number (international, digits only)", placeholder: "212600000000" }, { path: "address", label: "Address" }, { path: "maps", label: "Google Maps link" }, ...["facebook", "instagram", "linkedin", "twitter", "youtube", "tiktok"].map((s) => ({ path: `social.${s}`, label: `${s[0].toUpperCase()}${s.slice(1)} URL` }))] },
  { key: "home", title: "Home page texts", hint: "Leave empty to use the default translated text.", fields: [...i18n("hero_title", "Hero title", "textarea"), ...i18n("hero_subtitle", "Hero subtitle", "textarea"), ...i18n("cta_primary", "Primary button"), ...i18n("cta_secondary", "Secondary button")] },
  { key: "currency", title: "Currency", fields: [{ path: "eur_enabled", label: "Show EUR toggle on pricing page", type: "bool" }, { path: "eur_rate", label: "1 MAD = ? EUR", type: "number", placeholder: "0.092" }] },
  { key: "maintenance_mode", title: "Maintenance mode", hint: "When on, visitors see a “back soon” page. The admin stays reachable.", scalar: true, fields: [{ path: "", label: "Site under maintenance", type: "bool" }] },
  { key: "legal", title: "Legal pages", hint: "Use the toolbar for headings, bold, lists and links. This is generic starting text, not legal advice: have it reviewed before launch.", fields: [...i18n("terms", "Terms & conditions", "rich"), ...i18n("privacy", "Privacy policy", "rich")] },
  { key: "private_email_templates", title: "Email templates", hint: "Variables: {{reference}} {{name}} {{email}} {{phone}} {{project}} {{estimate}} {{appointment}} {{status}} {{link}}. Empty = default.",
    fields: ["client_confirmation", "admin_notification", "appointment_reminder", "appointment_update"].flatMap((k) => [{ path: `${k}.subject`, label: `${k.replace("_", " ")} — subject` }, { path: `${k}.body`, label: `${k.replace("_", " ")} — body`, type: "textarea" as const }]) },
  { key: "seo", title: "SEO per page", fields: PAGES.flatMap((p) => [...i18n(`${p}.title`, `${p} — meta title`), ...i18n(`${p}.description`, `${p} — meta description`, "textarea"), { path: `${p}.og_image`, label: `${p} — Open Graph image`, type: "image" as const }]) },
];

const get = (o: any, path: string) => (path ? path.split(".").reduce((a, k) => a?.[k], o) : o);
const put = (o: any, path: string, v: any) => {
  const out = { ...(o ?? {}) }; const ks = path.split("."); let cur = out;
  ks.slice(0, -1).forEach((k) => { cur[k] = { ...(cur[k] ?? {}) }; cur = cur[k]; });
  cur[ks[ks.length - 1]] = v; return out;
};

function SectionForm({ s, initial, placeholders }: { s: Section; initial: any; placeholders?: (p: string) => string | undefined }) {
  const [val, setVal] = useState<any>(initial ?? (s.scalar ? false : {}));
  const [msg, setMsg] = useState("");
  const [pending, start] = useTransition();
  const set = (path: string, v: any) => setVal((cur: any) => (s.scalar ? v : put(cur, path, v)));

  return (
    <Card className="p-5">
      <h2 className="text-lg font-semibold">{s.title}</h2>
      {s.hint && <p className="mb-3 text-sm text-muted-foreground">{s.hint}</p>}
      <div className="mt-3 grid gap-4 md:grid-cols-2">
        {s.fields.map((f) => {
          const v = get(val, f.path);
          const wide = f.type === "textarea" || f.type === "rich";
          if (f.type === "bool") return (<label key={f.path} className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={!!v} onChange={(e) => set(f.path, e.target.checked)} className="h-4 w-4 accent-[#F97316]" />{f.label}</label>);
          return (
            <div key={f.path} className={wide ? "md:col-span-2" : ""}>
              <span className="mb-1 block text-sm font-medium">{f.label}</span>
              {f.type === "rich" ? <RichText value={toHtml(v ?? "")} rtl={f.rtl} onChange={(h) => set(f.path, h)} />
                : f.type === "image" ? <ImageField value={v ?? ""} onChange={(u) => set(f.path, u)} folder="site" />
                : f.type === "textarea" ? <Textarea dir={f.rtl ? "rtl" : undefined} rows={4} value={v ?? ""} placeholder={placeholders?.(f.path)} onChange={(e) => set(f.path, e.target.value)} />
                : f.type === "color" ? <div className="flex gap-2"><input type="color" value={v || "#1E3A8A"} onChange={(e) => set(f.path, e.target.value)} className="h-10 w-14 rounded border border-border" aria-label={f.label} /><Input value={v ?? ""} onChange={(e) => set(f.path, e.target.value)} /></div>
                : <Input type={f.type === "number" ? "number" : "text"} step="any" dir={f.rtl ? "rtl" : undefined} value={v ?? ""} placeholder={f.placeholder ?? placeholders?.(f.path)} onChange={(e) => set(f.path, f.type === "number" ? Number(e.target.value) : e.target.value)} />}
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex items-center gap-3">
        <Button disabled={pending} onClick={() => start(async () => { const r = await saveSetting(s.key, val); setMsg(r.error ?? "Saved ✓"); })}>Save</Button>
        {msg && <span role="status" className="text-sm text-muted-foreground">{msg}</span>}
      </div>
    </Card>
  );
}

export default function SettingsEditor({ values, emailDefaults }: { values: Record<string, any>; emailDefaults: Record<string, { subject: string; body: string }> }) {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Site content & settings</h1>
      <nav className="flex flex-wrap gap-2 text-sm" aria-label="Sections">
        {sections.map((s) => (<a key={s.key} href={`#${s.key}`} className="rounded-full border border-border px-3 py-1 hover:bg-muted">{s.title}</a>))}
      </nav>
      {sections.map((s) => (
        <div key={s.key} id={s.key} className="scroll-mt-4">
          <SectionForm s={s} initial={values[s.key]} placeholders={s.key === "private_email_templates" ? (p) => { const [k, f] = p.split("."); return (emailDefaults as any)[k]?.[f]; } : undefined} />
        </div>
      ))}
    </div>
  );
}

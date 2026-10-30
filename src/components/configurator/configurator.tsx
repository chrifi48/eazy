"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Check, Paperclip, Wand2, X } from "lucide-react";
import { Badge, Button, Card, Field, Input, Select, Textarea } from "@/components/ui";
import { estimate } from "@/lib/pricing";
import { formatMoney, formatRange } from "@/lib/format";
import { L } from "@/lib/l";
import { MAX_UPLOAD_BYTES } from "@/lib/limits";
import { cn } from "@/lib/utils";

export type Catalog = { types: any[]; categories: any[]; templates: any[]; groups: any[]; features: any[]; packages: any[] };

const clientSchema = z.object({
  client_name: z.string().trim().min(2),
  business_name: z.string().optional().default(""),
  sector: z.string().optional().default(""),
  city: z.string().optional().default(""),
  country: z.string().optional().default(""),
  email: z.string().trim().email(),
  phone: z.string().optional().default(""),
  whatsapp: z.string().optional().default(""),
  language: z.enum(["fr", "ar", "en"]),
  description: z.string().optional().default(""),
  deadline: z.string().optional().default(""),
  budget_range: z.string().optional().default(""),
});
type Client = z.infer<typeof clientSchema>;

type State = {
  step: number; type: string | null; categoryId: string | null; templateId: string | null; custom: boolean;
  featureIds: string[]; packageId: string | null; client: Client; date: string; start: string;
  meeting: "video" | "in_person" | "phone"; files: { path: string; name: string }[]; terms: boolean;
};

const STORAGE_KEY = "eazy-start-v1";
const emptyClient = (language: Client["language"]): Client => ({ client_name: "", business_name: "", sector: "", city: "", country: "Maroc", email: "", phone: "", whatsapp: "", language, description: "", deadline: "", budget_range: "" });
const initial = (language: Client["language"]): State => ({ step: 1, type: null, categoryId: null, templateId: null, custom: false, featureIds: [], packageId: null, client: emptyClient(language), date: "", start: "", meeting: "video", files: [], terms: false });

export default function Configurator({ catalog, locale, initialTemplate, initialType, turnstileKey }: { catalog: Catalog; locale: string; initialTemplate?: string; initialType?: string; turnstileKey?: string }) {
  const t = useTranslations("start");
  const tc = useTranslations("common");
  const tt = useTranslations("types");
  const router = useRouter();
  const lang = locale as Client["language"];
  const [s, setS] = useState<State>(() => initial(lang));
  const [ready, setReady] = useState(false);
  const [restored, setRestored] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [token, setToken] = useState("");
  const topRef = useRef<HTMLDivElement>(null);

  // restore draft / apply deep links (?template=slug, ?type=slug)
  useEffect(() => {
    let next = initial(lang);
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) { next = { ...next, ...JSON.parse(raw) }; setRestored(next.step > 1 || !!next.type); }
    } catch { /* ignore */ }
    const tpl = catalog.templates.find((x) => x.slug === initialTemplate);
    if (tpl) {
      next = { ...next, type: initialType && tpl.typeSlugs.includes(initialType) ? initialType : tpl.typeSlugs[0] ?? "unsure", categoryId: tpl.category_id, templateId: tpl.id, custom: false, step: 4 };
      setRestored(false);
    } else if (initialType && catalog.types.some((x) => x.slug === initialType)) {
      next = { ...next, type: initialType, step: Math.max(next.step, 2) };
    }
    setS(next); setReady(true);
    window.onTurnstile = (tk: string) => setToken(tk);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => { if (ready) try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch { /* ignore */ } }, [s, ready]);

  const patch = (p: Partial<State>) => setS((x) => ({ ...x, ...p }));
  const go = (step: number) => { patch({ step }); setError(""); topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); };

  const categories = useMemo(() => catalog.categories.filter((c) => !s.type || s.type === "unsure" || c.typeSlugs.includes(s.type)), [catalog, s.type]);
  const templates = useMemo(() => catalog.templates.filter((x) => x.category_id === s.categoryId && (!s.type || s.type === "unsure" || x.typeSlugs.includes(s.type))), [catalog, s.categoryId, s.type]);
  const template = catalog.templates.find((x) => x.id === s.templateId) ?? null;
  const features = useMemo(() => catalog.features.filter((f) => !f.categoryIds.length || (s.categoryId && f.categoryIds.includes(s.categoryId))), [catalog, s.categoryId]);
  const chosenFeatures = features.filter((f) => s.featureIds.includes(f.id));
  const packages = catalog.packages.filter((p) => !p.category_id || p.category_id === s.categoryId);
  const pkg = catalog.packages.find((p) => p.id === s.packageId) ?? null;
  const category = catalog.categories.find((c) => c.id === s.categoryId);
  const typeRow = catalog.types.find((x) => x.slug === s.type);
  const est = estimate({ template: s.custom ? null : template, features: chosenFeatures });

  // ---- step 6 form
  const form = useForm<Client>({ resolver: zodResolver(clientSchema) as any, defaultValues: s.client });
  useEffect(() => { if (ready) form.reset(s.client); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [ready]);
  const [fileError, setFileError] = useState("");
  const [uploading, setUploading] = useState(false);

  async function upload(list: FileList | null) {
    if (!list) return;
    setFileError(""); setUploading(true);
    for (const f of Array.from(list)) {
      if (f.size > MAX_UPLOAD_BYTES) { setFileError(t("fileTooBig")); continue; }
      const body = new FormData();
      body.set("file", f); body.set("bucket", "request-files");
      try {
        const res = await fetch("/api/upload", { method: "POST", body });
        const j = await res.json();
        if (res.ok) setS((x) => ({ ...x, files: [...x.files, { path: j.path, name: f.name }].slice(0, 5) })); else setFileError(t("error"));
      } catch { setFileError(t("error")); }
    }
    setUploading(false);
  }

  // ---- step 7 availability (polled so taken slots disappear without a reload)
  const [slots, setSlots] = useState<Record<string, { start: string; end: string }[]>>({});
  const [slotsLoading, setSlotsLoading] = useState(false);
  const loadSlots = useCallback(async () => {
    const from = new Date(); const to = new Date(); to.setDate(to.getDate() + 45);
    try {
      const r = await fetch(`/api/slots?from=${from.toISOString().slice(0, 10)}&to=${to.toISOString().slice(0, 10)}`, { cache: "no-store" });
      const j = await r.json(); setSlots(j.slots ?? {});
      setS((x) => (x.date && !(j.slots?.[x.date] ?? []).some((sl: any) => sl.start === x.start) ? { ...x, start: "" } : x));
    } catch { /* keep previous */ } finally { setSlotsLoading(false); }
  }, []);
  useEffect(() => {
    if (s.step !== 7) return;
    setSlotsLoading(true); loadSlots();
    const id = setInterval(loadSlots, 10000);
    const vis = () => document.visibilityState === "visible" && loadSlots();
    document.addEventListener("visibilitychange", vis);
    return () => { clearInterval(id); document.removeEventListener("visibilitychange", vis); };
  }, [s.step, loadSlots]);
  const dates = Object.keys(slots).sort();
  const dayFmt = (d: string, o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(locale === "ar" ? "ar-MA-u-nu-latn" : locale, { timeZone: "UTC", ...o }).format(new Date(d + "T00:00:00Z"));

  async function next() {
    setError("");
    if (s.step === 1 && !s.type) return setError(t("pickOne"));
    if (s.step === 2 && !s.categoryId) return setError(t("pickOne"));
    if (s.step === 3 && !s.templateId && !s.custom) return setError(t("pickOne"));
    if (s.step === 6) {
      const ok = await form.trigger();
      if (!ok) return setError(t("fixErrors"));
      patch({ client: form.getValues() }); return go(7);
    }
    if (s.step === 7 && (!s.date || !s.start)) return setError(t("pickOne"));
    go(s.step + 1);
  }

  async function submit() {
    if (!s.terms) return setError(t("pickOne"));
    setBusy(true); setError("");
    try {
      const res = await fetch("/api/requests", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_type_id: typeRow?.id ?? null, category_id: s.categoryId, template_id: s.custom ? null : s.templateId, custom_design: s.custom,
          package_id: s.packageId, feature_ids: s.featureIds, client: s.client,
          appointment: { date: s.date, start: s.start, meeting_type: s.meeting }, files: s.files, accept_terms: true, website: honeypot, turnstile: token,
        }),
      });
      const j = await res.json();
      if (res.ok) { try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ } router.push(`/start/success?ref=${encodeURIComponent(j.reference)}`); return; }
      if (j.error === "slot_taken") { setError(t("slotTaken")); patch({ start: "" }); setS((x) => ({ ...x, step: 7 })); }
      else setError(res.status === 429 ? t("tooMany") : t("error"));
    } catch { setError(t("error")); }
    setBusy(false);
  }

  if (!ready) return <div className="h-96 animate-pulse rounded-2xl bg-muted" />;
  const showSidebar = s.step >= 3;
  const budgets = t.raw("budgets") as string[];
  const stepNames = t.raw("steps") as string[];

  const OptionCard = ({ active, onClick, title, desc, icon, badge }: { active: boolean; onClick: () => void; title: string; desc?: string; icon?: React.ReactNode; badge?: string }) => (
    <button type="button" onClick={onClick} aria-pressed={active}
      className={cn("relative flex w-full items-start gap-3 rounded-2xl border bg-card p-5 text-start transition hover:-translate-y-0.5 hover:shadow-soft", active ? "border-accent ring-2 ring-accent/40" : "border-border")}>
      {icon && <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary dark:text-blue-300">{icon}</span>}
      <span className="flex-1"><span className="block font-semibold">{title}</span>{desc && <span className="mt-0.5 block text-sm text-muted-foreground">{desc}</span>}{badge && <span className="mt-2 block text-sm font-semibold text-accent">{badge}</span>}</span>
      {active && <Check className="h-5 w-5 text-accent" />}
    </button>
  );

  return (
    <div ref={topRef} className="scroll-mt-24">
      <h1 className="text-3xl font-extrabold">{t("title")}</h1>

      {/* progress */}
      <div className="mt-6" role="progressbar" aria-valuemin={1} aria-valuemax={8} aria-valuenow={s.step} aria-label={stepNames[s.step - 1]}>
        <div className="mb-2 flex justify-between text-xs font-medium text-muted-foreground"><span>{s.step} / 8 — {stepNames[s.step - 1]}</span></div>
        <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-accent transition-all" style={{ width: `${(s.step / 8) * 100}%` }} /></div>
      </div>
      {restored && s.step > 1 && <p className="mt-3 text-sm text-muted-foreground">{t("restoreDraft")}</p>}

      <div className={cn("mt-8 grid gap-8", showSidebar && "lg:grid-cols-3")}>
        <div className={cn(showSidebar && "lg:col-span-2")}>
          <div>
            <motion.div key={s.step} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
              {s.step === 1 && (
                <section><h2 className="mb-4 text-xl font-bold">{t("s1")}</h2>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {catalog.types.map((p) => (<OptionCard key={p.id} active={s.type === p.slug} onClick={() => patch({ type: p.slug, categoryId: null, templateId: null, custom: false })} title={L(p, "name", locale)} desc={L(p, "description", locale)} />))}
                    <OptionCard active={s.type === "unsure"} onClick={() => patch({ type: "unsure", categoryId: null, templateId: null, custom: false })} title={tt("unsure")} />
                  </div>
                </section>
              )}

              {s.step === 2 && (
                <section><h2 className="mb-4 text-xl font-bold">{t("s2")}</h2>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {categories.map((c) => (<OptionCard key={c.id} active={s.categoryId === c.id} onClick={() => patch({ categoryId: c.id, templateId: null, custom: false, featureIds: [] })} title={L(c, "name", locale)} desc={L(c, "description", locale)} />))}
                  </div>
                </section>
              )}

              {s.step === 3 && (
                <section><h2 className="mb-4 text-xl font-bold">{t("s3")}</h2>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {templates.map((x) => (
                      <button type="button" key={x.id} onClick={() => patch({ templateId: x.id, custom: false })} aria-pressed={s.templateId === x.id}
                        className={cn("overflow-hidden rounded-2xl border bg-card text-start transition hover:-translate-y-0.5 hover:shadow-soft", s.templateId === x.id && !s.custom ? "border-accent ring-2 ring-accent/40" : "border-border")}>
                        <div className="relative aspect-[16/9] bg-gradient-to-br from-primary/15 to-accent/15">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          {x.thumbnail_url ? <img src={x.thumbnail_url} alt={L(x, "name", locale)} className="h-full w-full object-cover" /> : <span className="grid h-full place-items-center text-4xl font-black text-primary/30">{L(x, "name", locale).slice(0, 1)}</span>}
                        </div>
                        <div className="p-4"><p className="font-semibold">{L(x, "name", locale)}</p><p className="text-sm text-muted-foreground">{L(x, "short_desc", locale)}</p><p className="mt-2 text-sm font-semibold text-accent">{tc("from")} {formatMoney(Number(x.price_min), locale)}</p></div>
                      </button>
                    ))}
                    <OptionCard active={s.custom} onClick={() => patch({ custom: true, templateId: null })} title={t("customDesign")} desc={t("customDesignDesc")} icon={<Wand2 className="h-5 w-5" />} />
                  </div>
                </section>
              )}

              {s.step === 4 && (
                <section><h2 className="mb-4 text-xl font-bold">{t("s4")}</h2>
                  <div className="space-y-6">
                    {catalog.groups.map((g) => {
                      const items = features.filter((f) => f.group_id === g.id);
                      if (!items.length) return null;
                      return (
                        <fieldset key={g.id}><legend className="mb-2 font-semibold text-primary dark:text-blue-300">{L(g, "name", locale)}</legend>
                          <div className="grid gap-3 sm:grid-cols-2">
                            {items.map((f) => {
                              const on = s.featureIds.includes(f.id);
                              return (
                                <label key={f.id} className={cn("flex cursor-pointer items-start gap-3 rounded-xl border bg-card p-4 transition", on ? "border-accent bg-accent/5" : "border-border hover:border-accent/50")}>
                                  <input type="checkbox" checked={on} onChange={() => patch({ featureIds: on ? s.featureIds.filter((i) => i !== f.id) : [...s.featureIds, f.id] })} className="mt-1 h-4 w-4 accent-[#F97316]" />
                                  <span className="flex-1"><span className="block text-sm font-medium">{L(f, "name", locale)}</span>
                                    {L(f, "description", locale) && <span className="block text-xs text-muted-foreground">{L(f, "description", locale)}</span>}
                                    <span className="mt-1 block text-xs text-muted-foreground">+{formatRange(Number(f.price_min), Number(f.price_max), locale)} · +{f.extra_days} {tc("days")}</span></span>
                                </label>
                              );
                            })}
                          </div>
                        </fieldset>
                      );
                    })}
                  </div>
                </section>
              )}

              {s.step === 5 && (
                <section><h2 className="mb-4 text-xl font-bold">{t("s5")}</h2>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <OptionCard active={!s.packageId} onClick={() => patch({ packageId: null })} title={t("noPackage")} />
                    {packages.map((p) => (<OptionCard key={p.id} active={s.packageId === p.id} onClick={() => patch({ packageId: p.id })} title={L(p, "name", locale)} desc={L(p, "description", locale)} badge={`${tc("from")} ${formatMoney(Number(p.price), locale)}`} />))}
                  </div>
                </section>
              )}

              {s.step === 6 && (
                <section><h2 className="mb-4 text-xl font-bold">{t("s6")}</h2>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label={`${t("fullName")} *`} error={form.formState.errors.client_name && tc("required")}><Input {...form.register("client_name")} autoComplete="name" /></Field>
                    <Field label={t("businessName")}><Input {...form.register("business_name")} autoComplete="organization" /></Field>
                    <Field label={t("sector")}><Input {...form.register("sector")} /></Field>
                    <Field label={t("city")}><Input {...form.register("city")} autoComplete="address-level2" /></Field>
                    <Field label={t("country")}><Input {...form.register("country")} autoComplete="country-name" /></Field>
                    <Field label={`${t("email")} *`} error={form.formState.errors.email && tc("required")}><Input type="email" {...form.register("email")} autoComplete="email" dir="ltr" /></Field>
                    <Field label={t("phone")}><Input type="tel" {...form.register("phone")} autoComplete="tel" dir="ltr" /></Field>
                    <Field label={t("whatsapp")}><Input type="tel" {...form.register("whatsapp")} dir="ltr" /></Field>
                    <Field label={t("language")}><Select {...form.register("language")}><option value="fr">Français</option><option value="ar">العربية</option><option value="en">English</option></Select></Field>
                    <Field label={t("deadline")}><Input type="date" {...form.register("deadline")} /></Field>
                    <Field label={t("budget")} className="sm:col-span-2"><Select {...form.register("budget_range")}><option value="">—</option>{budgets.map((b) => (<option key={b} value={b}>{b}</option>))}</Select></Field>
                    <Field label={t("description")} className="sm:col-span-2"><Textarea {...form.register("description")} rows={5} /></Field>
                    <div className="sm:col-span-2">
                      <p className="mb-1 text-sm font-medium">{t("files")}</p>
                      <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground hover:bg-muted">
                        <Paperclip className="h-4 w-4" />{uploading ? "…" : tc("optional")}
                        <input type="file" multiple className="sr-only" onChange={(e) => upload(e.target.files)} disabled={uploading || s.files.length >= 5} />
                      </label>
                      {fileError && <p role="alert" className="mt-1 text-xs text-red-600">{fileError}</p>}
                      <ul className="mt-2 space-y-1">{s.files.map((f) => (<li key={f.path} className="flex items-center justify-between rounded-lg bg-muted px-3 py-1.5 text-sm">{f.name}<button type="button" aria-label="Remove" onClick={() => patch({ files: s.files.filter((x) => x.path !== f.path) })}><X className="h-4 w-4" /></button></li>))}</ul>
                    </div>
                  </div>
                </section>
              )}

              {s.step === 7 && (
                <section><h2 className="mb-4 text-xl font-bold">{t("s7")}</h2>
                  <p className="mb-2 text-sm font-medium">{t("pickDate")}</p>
                  {slotsLoading && !dates.length ? <div className="h-20 animate-pulse rounded-xl bg-muted" /> : !dates.length ? <p className="text-muted-foreground">{t("noSlots")}</p> : (
                    <div className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
                      {dates.map((d) => (
                        <button type="button" key={d} onClick={() => patch({ date: d, start: "" })} aria-pressed={s.date === d}
                          className={cn("w-20 shrink-0 snap-start rounded-xl border p-2 text-center transition", s.date === d ? "border-accent bg-accent text-white" : "border-border bg-card hover:border-accent")}>
                          <span className="block text-xs capitalize">{dayFmt(d, { weekday: "short" })}</span><span className="block text-xl font-bold">{dayFmt(d, { day: "numeric" })}</span><span className="block text-xs capitalize">{dayFmt(d, { month: "short" })}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {s.date && (<>
                    <p className="mb-2 mt-6 text-sm font-medium">{t("pickSlot")}</p>
                    <div className="flex flex-wrap gap-2">
                      {(slots[s.date] ?? []).map((sl) => (<button type="button" key={sl.start} onClick={() => patch({ start: sl.start })} aria-pressed={s.start === sl.start} dir="ltr"
                        className={cn("rounded-xl border px-4 py-2 text-sm font-medium transition", s.start === sl.start ? "border-accent bg-accent text-white" : "border-border bg-card hover:border-accent")}>{sl.start}</button>))}
                      {!(slots[s.date] ?? []).length && <p className="text-muted-foreground">{t("noSlots")}</p>}
                    </div>
                  </>)}
                  <p className="mb-2 mt-6 text-sm font-medium">{t("meetingType")}</p>
                  <div className="flex flex-wrap gap-2">
                    {([["video", t("video")], ["in_person", t("inPerson")], ["phone", t("phone_")]] as const).map(([v, label]) => (
                      <button type="button" key={v} onClick={() => patch({ meeting: v })} aria-pressed={s.meeting === v} className={cn("rounded-xl border px-4 py-2 text-sm font-medium", s.meeting === v ? "border-primary bg-primary text-white" : "border-border bg-card hover:border-primary")}>{label}</button>
                    ))}
                  </div>
                </section>
              )}

              {s.step === 8 && (
                <section><h2 className="mb-4 text-xl font-bold">{t("s8")}</h2>
                  <Card className="divide-y divide-border text-sm">
                    <Row k={stepNames[0]} v={typeRow ? L(typeRow, "name", locale) : tt("unsure")} />
                    <Row k={stepNames[1]} v={L(category, "name", locale)} />
                    <Row k={stepNames[2]} v={s.custom ? t("customLabel") : L(template, "name", locale)} />
                    <Row k={t("features")} v={chosenFeatures.map((f) => L(f, "name", locale)).join(", ") || "—"} />
                    {pkg && <Row k={t("package")} v={`${L(pkg, "name", locale)} — ${formatMoney(Number(pkg.price), locale)}`} />}
                    <Row k={t("estimate")} v={`${formatRange(est.min, est.max, locale)} · ${est.days} ${tc("days")}`} />
                    <Row k={t("fullName")} v={`${s.client.client_name}${s.client.business_name ? ` — ${s.client.business_name}` : ""}`} />
                    <Row k={t("email")} v={`${s.client.email} ${s.client.phone}`} />
                    <Row k={t("appointment")} v={`${s.date} ${s.start} (${s.meeting === "video" ? t("video") : s.meeting === "phone" ? t("phone_") : t("inPerson")})`} />
                  </Card>
                  <p className="mt-4 text-sm text-muted-foreground">{t("estimateNote")}</p>
                  <label className="mt-4 flex items-start gap-2 text-sm"><input type="checkbox" checked={s.terms} onChange={(e) => patch({ terms: e.target.checked })} className="mt-1 h-4 w-4 accent-[#F97316]" />{t("terms")}</label>
                  {/* honeypot: invisible to people, bots fill it */}
                  <input tabIndex={-1} autoComplete="off" aria-hidden value={honeypot} onChange={(e) => setHoneypot(e.target.value)} name="website" className="absolute -left-[9999px] h-0 w-0 opacity-0" />
                  {turnstileKey && (<><Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer /><div className="cf-turnstile mt-4" data-sitekey={turnstileKey} data-callback="onTurnstile" /></>)}
                </section>
              )}
            </motion.div>
          </div>

          {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{error}</p>}

          <div className="mt-8 flex justify-between gap-3">
            <Button variant="outline" onClick={() => go(s.step - 1)} disabled={s.step === 1 || busy}>{tc("back")}</Button>
            {s.step < 8 ? <Button onClick={next}>{tc("next")}</Button> : <Button variant="accent" onClick={submit} disabled={busy}>{busy ? t("submitting") : tc("submit")}</Button>}
          </div>
        </div>

        {showSidebar && (
          <aside className="lg:col-span-1">
            <Card className="p-5 lg:sticky lg:top-24" aria-live="polite">
              <p className="text-sm font-semibold text-muted-foreground">{t("estimate")}</p>
              <p className="mt-1 text-2xl font-extrabold text-primary dark:text-blue-300" data-testid="estimate">{formatRange(est.min, est.max, locale)}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t("estimateDays")}: <b className="text-foreground">{est.days} {tc("days")}</b></p>
              {pkg && <p className="mt-2 text-sm"><Badge>{L(pkg, "name", locale)}</Badge> {formatMoney(Number(pkg.price), locale)}</p>}
              <dl className="mt-4 space-y-1 border-t border-border pt-4 text-sm">
                {!s.custom && template && <div className="flex justify-between gap-2"><dt className="text-muted-foreground">{t("baseModel")}</dt><dd className="font-medium">{L(template, "name", locale)}</dd></div>}
                {s.custom && <div className="flex justify-between"><dt className="text-muted-foreground">{t("baseModel")}</dt><dd className="font-medium">{t("customLabel")}</dd></div>}
                {chosenFeatures.map((f) => (<div key={f.id} className="flex justify-between gap-2"><dt className="text-muted-foreground">{L(f, "name", locale)}</dt><dd>+{formatMoney(Number(f.price_min), locale)}</dd></div>))}
              </dl>
              <p className="mt-4 rounded-lg bg-muted p-3 text-xs text-muted-foreground">{t("estimateNote")}</p>
            </Card>
          </aside>
        )}
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return <div className="flex flex-col gap-1 p-4 sm:flex-row sm:justify-between"><span className="text-muted-foreground">{k}</span><span className="font-medium sm:text-end">{v || "—"}</span></div>;
}

declare global { interface Window { onTurnstile?: (t: string) => void } }

"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Minus } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Badge, buttonClass, Card } from "@/components/ui";
import { formatMoney } from "@/lib/format";
import { L } from "@/lib/l";
import { cn } from "@/lib/utils";

const items = (p: any, locale: string): string[] => (p[`items_${locale}`]?.length ? p[`items_${locale}`] : p.items_fr) ?? [];

export default function PricingView({ packages, locale, eurEnabled, eurRate }: { packages: any[]; locale: string; eurEnabled: boolean; eurRate: number }) {
  const t = useTranslations("pricing");
  const tc = useTranslations("common");
  const [cur, setCur] = useState<"MAD" | "EUR">("MAD");
  const money = (n: number) => formatMoney(n, locale, cur, eurRate);
  const projects = packages.filter((p) => p.kind !== "maintenance");
  const plans = packages.filter((p) => p.kind === "maintenance");
  const per = (b: string) => (b === "monthly" ? t("monthly") : b === "yearly" ? t("yearly") : t("oneTime"));
  // "Support (3 months)" and "Support (12 months)" share one row ("Support") showing the value in each column
  const split = (s: string) => { const m = /^(.*?)\s*\((.+)\)\s*$/.exec(s); return m ? { key: m[1], val: m[2] } : { key: s, val: null as string | null }; };
  const rowKeys = Array.from(new Set(projects.flatMap((p) => items(p, locale).map((i) => split(i).key))));
  const cell = (p: any, key: string) => items(p, locale).map(split).find((x) => x.key === key);

  return (
    <div>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-sm text-muted-foreground">{t("note")}</p>
        {eurEnabled && (
          <div className="inline-flex rounded-xl border border-border p-0.5" role="group" aria-label={tc("currency")}>
            {(["MAD", "EUR"] as const).map((c) => (<button key={c} onClick={() => setCur(c)} aria-pressed={cur === c} className={cn("rounded-lg px-4 py-1.5 text-sm font-semibold", cur === c ? "bg-primary text-white" : "hover:bg-muted")}>{c}</button>))}
          </div>
        )}
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {projects.map((p) => (
          <Card key={p.id} className={cn("relative flex flex-col p-6", p.is_highlighted && "border-accent ring-2 ring-accent/30 md:-mt-3 md:pb-9")}>
            {p.is_highlighted && <Badge className="mb-3 w-fit bg-accent text-white">{t("highlight")}</Badge>}
            <h2 className="text-xl font-bold">{L(p, "name", locale)}</h2>
            <p className="text-sm text-muted-foreground">{L(p, "description", locale)}</p>
            <p className="mt-4 text-xs text-muted-foreground">{tc("from")}</p>
            <p className="text-3xl font-extrabold">{money(Number(p.price))}</p>
            <ul className="mt-5 flex-1 space-y-2 text-sm">{items(p, locale).map((it) => (<li key={it} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />{it}</li>))}</ul>
            <Link href="/start" className={buttonClass(p.is_highlighted ? "accent" : "primary", "mt-6")}>{t("cta")}</Link>
          </Card>
        ))}
      </div>

      {projects.length > 1 && rowKeys.length > 0 && (<>
        <h2 className="mb-2 mt-20 text-2xl font-bold">{t("compare")}</h2>
        <p className="mb-6 text-sm text-muted-foreground">{t("compareHint")}</p>
        <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-soft">
          <table className="w-full table-fixed border-separate sm:min-w-[560px] border-spacing-0 text-sm">
            <thead>
              <tr>
                <th scope="col" className="sticky start-0 z-10 w-[30%] border-b border-border bg-card p-2.5 text-start align-bottom text-[10px] font-medium uppercase leading-tight tracking-normal text-muted-foreground [overflow-wrap:anywhere] sm:p-4 sm:text-xs sm:tracking-wide">{t("feature")}</th>
                {projects.map((p) => (
                  <th key={p.id} scope="col" className={cn("border-b border-border p-1.5 text-center align-bottom sm:p-4", p.is_highlighted && "bg-accent/10")}>
                    {p.is_highlighted && <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-accent">{t("highlight")}</span>}
                    <span className="block text-sm font-bold sm:text-base">{L(p, "name", locale)}</span>
                    <span className="block text-xs font-extrabold text-primary dark:text-blue-300 sm:text-lg">{money(Number(p.price))}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rowKeys.map((it) => (
                <tr key={it} className="group">
                  <th scope="row" className="sticky start-0 z-10 border-b border-border bg-card p-2.5 text-start text-xs font-normal group-hover:bg-muted sm:p-4 sm:text-sm">{it}</th>
                  {projects.map((p) => {
                    const c = cell(p, it);
                    return (
                      <td key={p.id} className={cn("border-b border-border p-1.5 text-center group-hover:bg-muted/60 sm:p-4", p.is_highlighted && "bg-accent/5")}>
                        {c ? (c.val ? <span className="text-xs font-semibold sm:text-sm">{c.val}</span> : <Check className="mx-auto h-5 w-5 text-accent" aria-label={t("included")} />) : <Minus className="mx-auto h-4 w-4 text-muted-foreground/60" aria-label={t("notIncluded")} />}
                      </td>
                    );
                  })}
                </tr>
              ))}
              <tr>
                <th scope="row" className="sticky start-0 z-10 bg-card p-3 sm:p-4" />
                {projects.map((p) => (
                  <td key={p.id} className={cn("p-1.5 text-center sm:p-4", p.is_highlighted && "bg-accent/5")}>
                    <Link href="/start" className={buttonClass(p.is_highlighted ? "accent" : "outline", "w-full !px-2 !py-2 text-xs sm:!px-3 sm:text-sm")}>{t("choose")}</Link>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </>)}

      {plans.length > 0 && (<>
        <h2 className="mb-6 mt-20 text-2xl font-bold">{t("maintenance")}</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {plans.map((p) => (
            <Card key={p.id} className={cn("p-6", p.is_highlighted && "border-accent ring-2 ring-accent/30")}>
              {p.is_highlighted && <Badge className="mb-3 w-fit bg-accent text-white">{t("highlight")}</Badge>}
              <h3 className="text-lg font-bold">{L(p, "name", locale)}</h3>
              <p className="text-sm text-muted-foreground">{L(p, "description", locale)}</p>
              <p className="mt-3 text-2xl font-extrabold">{money(Number(p.price))} <span className="text-sm font-normal text-muted-foreground">{per(p.billing_type)}</span></p>
              <ul className="mt-4 space-y-2 text-sm">{items(p, locale).map((it) => (<li key={it} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />{it}</li>))}</ul>
            </Card>
          ))}
        </div>
      </>)}
    </div>
  );
}

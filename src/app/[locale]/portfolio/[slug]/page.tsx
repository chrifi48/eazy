import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ExternalLink } from "lucide-react";
import { buttonClass, Badge, Container } from "@/components/ui";
import { L, pub, safe } from "@/lib/data";
import { pageMeta } from "@/lib/seo";

/* eslint-disable @typescript-eslint/no-explicit-any */
async function load(slug: string) {
  const rows = await safe(() => pub().from("portfolio_projects").select("*, categories(name_fr,name_ar,name_en)").eq("slug", slug).eq("is_published", true).limit(1), [] as any[]);
  return rows[0];
}

export async function generateMetadata({ params: { locale, slug } }: { params: { locale: string; slug: string } }) {
  const p = await load(slug);
  if (!p) return {};
  return pageMeta(`portfolio:${slug}`, locale, { title: L(p, "title", locale), description: L(p, "description", locale).slice(0, 160), image: p.images?.[0] });
}

export default async function ProjectPage({ params: { locale, slug } }: { params: { locale: string; slug: string } }) {
  const p = await load(slug);
  if (!p) notFound();
  const t = await getTranslations({ locale, namespace: "portfolio" });
  return (
    <Container className="max-w-4xl py-12">
      {p.categories && <Badge>{L(p.categories, "name", locale)}</Badge>}
      <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">{L(p, "title", locale)}</h1>
      {p.client_name && <p className="mt-2 text-muted-foreground">{t("client")}: {p.client_name}</p>}
      <div className="mt-8 space-y-4">
        {(p.images ?? []).map((src: string, i: number) => (
          <div key={src} className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-border"><Image src={src} alt={`${L(p, "title", locale)} ${i + 1}`} unoptimized={src.endsWith(".svg")} fill sizes="(max-width:1024px) 100vw, 896px" className="object-cover" priority={i === 0} /></div>
        ))}
      </div>
      <p className="mt-8 whitespace-pre-line text-lg leading-relaxed text-muted-foreground">{L(p, "description", locale)}</p>
      {L(p, "result", locale) && (<><h2 className="mb-2 mt-8 text-xl font-bold">{t("result")}</h2><p className="whitespace-pre-line text-muted-foreground">{L(p, "result", locale)}</p></>)}
      {p.technologies?.length > 0 && (<><h2 className="mb-3 mt-8 text-xl font-bold">{t("tech")}</h2><div className="flex flex-wrap gap-2">{p.technologies.map((x: string) => (<Badge key={x}>{x}</Badge>))}</div></>)}
      {p.link && <a href={p.link} target="_blank" rel="noopener noreferrer" className={buttonClass("accent", "mt-8")}>{t("visit")}<ExternalLink className="h-4 w-4" /></a>}
    </Container>
  );
}

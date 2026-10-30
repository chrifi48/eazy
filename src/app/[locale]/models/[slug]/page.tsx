import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Check, Clock, ExternalLink } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Badge, buttonClass, Card, Container, SectionTitle } from "@/components/ui";
import { TemplateCard, TEMPLATE_SELECT } from "@/components/site/cards";
import { ImageGallery } from "@/components/site/client-bits";
import { L, pub, safe } from "@/lib/data";
import { formatMoney } from "@/lib/format";
import { JsonLd, pageMeta, siteUrl } from "@/lib/seo";

async function load(slug: string) {
  const rows = await safe(() => pub().from("templates").select(`${TEMPLATE_SELECT}, template_images(image_url,device,sort_order)`).eq("slug", slug).eq("is_active", true).limit(1), [] as never[]);
  return rows[0] as Record<string, any> | undefined; // eslint-disable-line @typescript-eslint/no-explicit-any
}

export async function generateMetadata({ params: { locale, slug } }: { params: { locale: string; slug: string } }) {
  const tpl = await load(slug);
  if (!tpl) return {};
  return pageMeta(`model:${slug}`, locale, { title: L(tpl, "name", locale), description: L(tpl, "short_desc", locale), image: tpl.thumbnail_url });
}

export default async function ModelPage({ params: { locale, slug } }: { params: { locale: string; slug: string } }) {
  const tpl = await load(slug);
  if (!tpl) notFound();
  const t = await getTranslations({ locale });
  const images = [...(tpl.template_images ?? [])].sort((a, b) => a.sort_order - b.sort_order).map((i) => ({ url: i.image_url, device: i.device }));
  if (!images.length && tpl.thumbnail_url) images.push({ url: tpl.thumbnail_url, device: "desktop" });
  const similar = await safe(() => pub().from("templates").select(TEMPLATE_SELECT).eq("is_active", true).eq("category_id", tpl.category_id).neq("id", tpl.id).limit(3), []);
  const name = L(tpl, "name", locale);

  return (
    <Container className="py-12">
      <JsonLd data={{ "@context": "https://schema.org", "@type": "Service", name, description: L(tpl, "short_desc", locale), provider: { "@type": "LocalBusiness", name: "eazy", url: siteUrl() }, offers: { "@type": "Offer", priceCurrency: "MAD", price: tpl.price_min } }} />
      <div className="grid gap-10 lg:grid-cols-5">
        <div className="lg:col-span-3"><ImageGallery images={images} alt={name} /></div>
        <div className="lg:col-span-2">
          {tpl.categories && <Badge>{L(tpl.categories, "name", locale)}</Badge>}
          <h1 className="mt-3 text-3xl font-extrabold">{name}</h1>
          <p className="mt-3 text-muted-foreground">{L(tpl, "short_desc", locale)}</p>
          <Card className="mt-6 p-5">
            <p className="text-sm text-muted-foreground">{t("models.startingFrom")}</p>
            <p className="text-3xl font-extrabold">{formatMoney(Number(tpl.price_min), locale)}</p>
            <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground"><Clock className="h-4 w-4" />{t("models.delivery")}: <b className="text-foreground">{tpl.delivery_days} {t("common.days")}</b></p>
          </Card>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={`/start?template=${tpl.slug}`} className={buttonClass("accent", "flex-1")}>{t("common.customize")}</Link>
            {tpl.demo_url && <a href={tpl.demo_url} target="_blank" rel="noopener noreferrer" className={buttonClass("outline")}>{t("models.demo")}<ExternalLink className="h-4 w-4" /></a>}
          </div>
        </div>
      </div>

      <div className="mt-12 grid gap-10 lg:grid-cols-3">
        <div className="whitespace-pre-line text-muted-foreground lg:col-span-2">{L(tpl, "long_desc", locale) || L(tpl, "short_desc", locale)}</div>
        <div className="space-y-8">
          {tpl.included_features?.length > 0 && (
            <div><h2 className="mb-3 font-bold">{t("models.included")}</h2><ul className="space-y-2 text-sm">{tpl.included_features.map((f: string) => (<li key={f} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />{f}</li>))}</ul></div>
          )}
          {tpl.technologies?.length > 0 && (
            <div><h2 className="mb-3 font-bold">{t("models.tech")}</h2><div className="flex flex-wrap gap-2">{tpl.technologies.map((x: string) => (<Badge key={x}>{x}</Badge>))}</div></div>
          )}
        </div>
      </div>

      {similar.length > 0 && (
        <div className="mt-16">
          <SectionTitle title={t("models.similar")} />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{await Promise.all(similar.map((s) => <TemplateCard key={s.id} tpl={s} locale={locale} />))}</div>
        </div>
      )}
    </Container>
  );
}

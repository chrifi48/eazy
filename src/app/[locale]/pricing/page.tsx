import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui";
import PricingView from "@/components/site/pricing-view";
import { getSetting, pub, safe } from "@/lib/data";
import { pageMeta } from "@/lib/seo";

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale, namespace: "pricing" });
  return pageMeta("pricing", locale, { title: t("title"), description: t("subtitle") });
}

export default async function PricingPage({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale, namespace: "pricing" });
  const sb = pub();
  const [packages, currency] = await Promise.all([
    safe(() => sb.from("packages").select("*").eq("is_active", true).order("sort_order"), [] as Record<string, unknown>[]),
    getSetting<{ eur_enabled?: boolean; eur_rate?: number }>("currency", { eur_enabled: true, eur_rate: 0.092 }),
  ]);
  return (
    <Container className="py-12">
      <h1 className="text-3xl font-extrabold sm:text-4xl">{t("title")}</h1>
      <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
      <PricingView packages={packages as never} locale={locale} eurEnabled={currency.eur_enabled !== false} eurRate={Number(currency.eur_rate) || 0.092} />
    </Container>
  );
}

import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Badge, Card, Container } from "@/components/ui";
import { Thumb } from "@/components/site/cards";
import { L, pub, safe } from "@/lib/data";
import { pageMeta } from "@/lib/seo";

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale, namespace: "portfolio" });
  return pageMeta("portfolio", locale, { title: t("title"), description: t("subtitle") });
}

export default async function PortfolioPage({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale });
  const projects = await safe(() => pub().from("portfolio_projects").select("*, categories(name_fr,name_ar,name_en)").eq("is_published", true).order("sort_order").order("created_at", { ascending: false }), [] as any[]); // eslint-disable-line @typescript-eslint/no-explicit-any
  return (
    <Container className="py-12">
      <h1 className="text-3xl font-extrabold sm:text-4xl">{t("portfolio.title")}</h1>
      <p className="mt-2 text-muted-foreground">{t("portfolio.subtitle")}</p>
      {projects.length === 0 ? <p className="mt-16 text-center text-muted-foreground">{t("common.noResults")}</p> : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <Link key={p.id} href={`/portfolio/${p.slug}`}>
              <Card className="group h-full overflow-hidden transition hover:-translate-y-1 hover:shadow-xl">
                <Thumb src={p.images?.[0]} alt={L(p, "title", locale)} />
                <div className="p-5">
                  {p.categories && <Badge>{L(p.categories, "name", locale)}</Badge>}
                  <h2 className="mt-2 text-lg font-bold">{L(p, "title", locale)}</h2>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{L(p, "description", locale)}</p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </Container>
  );
}

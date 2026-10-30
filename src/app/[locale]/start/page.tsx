import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui";
import Configurator, { type Catalog } from "@/components/configurator/configurator";
import { pub, safe } from "@/lib/data";
import { pageMeta } from "@/lib/seo";

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale, namespace: "start" });
  return pageMeta("start", locale, { title: t("title") });
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export default async function StartPage({ params: { locale }, searchParams }: { params: { locale: string }; searchParams: { template?: string; type?: string } }) {
  const sb = pub();
  const [types, cats, tpls, groups, feats, pkgs] = await Promise.all([
    safe(() => sb.from("project_types").select("*").eq("is_active", true).order("sort_order"), [] as any[]),
    safe(() => sb.from("categories").select("*, category_project_types(project_types(slug))").eq("is_active", true).order("sort_order"), [] as any[]),
    safe(() => sb.from("templates").select("*, template_project_types(project_types(slug))").eq("is_active", true).order("sort_order"), [] as any[]),
    safe(() => sb.from("feature_groups").select("*").order("sort_order"), [] as any[]),
    safe(() => sb.from("features").select("*, feature_categories(category_id)").eq("is_active", true).order("sort_order"), [] as any[]),
    safe(() => sb.from("packages").select("*").eq("is_active", true).eq("kind", "project").order("sort_order"), [] as any[]),
  ]);

  const slugs = (rows: any[]) => (rows ?? []).map((r) => r.project_types?.slug).filter(Boolean) as string[];
  const catalog: Catalog = {
    types,
    categories: cats.map((c) => ({ ...c, typeSlugs: slugs(c.category_project_types) })),
    templates: tpls.map((t) => ({ ...t, typeSlugs: slugs(t.template_project_types) })),
    groups,
    features: feats.map((f) => ({ ...f, categoryIds: (f.feature_categories ?? []).map((x: any) => x.category_id) })),
    packages: pkgs,
  };

  return (
    <Container className="py-10">
      <Configurator catalog={catalog} locale={locale} initialTemplate={searchParams.template} initialType={searchParams.type} turnstileKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY} />
    </Container>
  );
}

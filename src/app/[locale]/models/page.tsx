import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { buttonClass, Container, Input, Select } from "@/components/ui";
import { TemplateCard } from "@/components/site/cards";
import { L, pub, safe } from "@/lib/data";
import { pageMeta } from "@/lib/seo";

const PAGE_SIZE = 9;

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale, namespace: "models" });
  return pageMeta("models", locale, { title: t("title"), description: t("subtitle") });
}

type SP = { type?: string; category?: string; min?: string; max?: string; q?: string; page?: string };

export default async function ModelsPage({ params: { locale }, searchParams: sp }: { params: { locale: string }; searchParams: SP }) {
  const t = await getTranslations({ locale });
  const sb = pub();
  const page = Math.max(1, Number(sp.page) || 1);

  const [types, cats] = await Promise.all([
    safe(() => sb.from("project_types").select("*").eq("is_active", true).order("sort_order"), []),
    safe(() => sb.from("categories").select("*").eq("is_active", true).order("sort_order"), []),
  ]);

  const catId = cats.find((c) => c.slug === sp.category)?.id;
  // !inner only when filtering by project type, so unfiltered templates without a link still show
  const select = `*, categories(id,slug,name_fr,name_ar,name_en), template_project_types${sp.type ? "!inner" : ""}(project_types${sp.type ? "!inner" : ""}(slug))`;
  let q = sb.from("templates").select(select, { count: "exact" }).eq("is_active", true);
  if (sp.type) q = q.eq("template_project_types.project_types.slug", sp.type);
  if (catId) q = q.eq("category_id", catId);
  if (sp.min) q = q.gte("price_min", Number(sp.min));
  if (sp.max) q = q.lte("price_min", Number(sp.max));
  if (sp.q) q = q.or(`name_fr.ilike.%${sp.q.replace(/[%,()]/g, "")}%,name_en.ilike.%${sp.q.replace(/[%,()]/g, "")}%,name_ar.ilike.%${sp.q.replace(/[%,()]/g, "")}%`);
  q = q.order("sort_order").range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  let list: unknown[] = [];
  let total = 0;
  try { const r = await q; list = r.data ?? []; total = r.count ?? 0; } catch { /* unconfigured */ }
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const qs = (p: number) => { const u = new URLSearchParams(Object.entries({ ...sp, page: String(p) }).filter(([, v]) => v) as [string, string][]); return `/models?${u}`; };

  return (
    <Container className="py-12">
      <h1 className="text-3xl font-extrabold sm:text-4xl">{t("models.title")}</h1>
      <p className="mt-2 text-muted-foreground">{t("models.subtitle")}</p>

      <form method="get" className="mt-8 grid gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft sm:grid-cols-2 lg:grid-cols-6">
        <Input name="q" defaultValue={sp.q} placeholder={t("models.searchPlaceholder")} aria-label={t("common.search")} className="lg:col-span-2" />
        <Select name="type" defaultValue={sp.type ?? ""} aria-label={t("models.type")}>
          <option value="">{t("models.type")}: {t("common.all")}</option>
          {types.map((p) => (<option key={p.id} value={p.slug}>{L(p, "name", locale)}</option>))}
        </Select>
        <Select name="category" defaultValue={sp.category ?? ""} aria-label={t("models.category")}>
          <option value="">{t("models.category")}: {t("common.all")}</option>
          {cats.map((c) => (<option key={c.id} value={c.slug}>{L(c, "name", locale)}</option>))}
        </Select>
        <Input name="min" type="number" min={0} defaultValue={sp.min} placeholder={t("models.minPrice")} aria-label={t("models.minPrice")} />
        <Input name="max" type="number" min={0} defaultValue={sp.max} placeholder={t("models.maxPrice")} aria-label={t("models.maxPrice")} />
        <div className="flex gap-2 sm:col-span-2 lg:col-span-6">
          <button className={buttonClass("primary")}>{t("common.apply")}</button>
          <Link href="/models" className={buttonClass("outline")}>{t("common.reset")}</Link>
        </div>
      </form>

      {list.length === 0 ? (
        <p className="mt-16 text-center text-muted-foreground">{t("common.noResults")}</p>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {await Promise.all(list.map((tp) => <TemplateCard key={(tp as { id: string }).id} tpl={tp} locale={locale} />))}
        </div>
      )}

      {pages > 1 && (
        <nav className="mt-10 flex items-center justify-center gap-2" aria-label="Pagination">
          {page > 1 && <Link href={qs(page - 1)} className={buttonClass("outline")}>{t("common.prev")}</Link>}
          <span className="px-3 text-sm text-muted-foreground">{page} / {pages}</span>
          {page < pages && <Link href={qs(page + 1)} className={buttonClass("outline")}>{t("common.next")}</Link>}
        </nav>
      )}
    </Container>
  );
}

import type { MetadataRoute } from "next";
import { pub, safe } from "@/lib/data";
import { routing } from "@/i18n/routing";
import { siteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const sb = pub();
  const [tpls, projects] = await Promise.all([
    safe(() => sb.from("templates").select("slug").eq("is_active", true), [] as { slug: string }[]),
    safe(() => sb.from("portfolio_projects").select("slug").eq("is_published", true), [] as { slug: string }[]),
  ]);
  const paths = ["", "/models", "/pricing", "/portfolio", "/about", "/contact", "/start", "/terms", "/privacy",
    ...tpls.map((t) => `/models/${t.slug}`), ...projects.map((p) => `/portfolio/${p.slug}`)];
  const url = (l: string, p: string) => `${base}${l === routing.defaultLocale ? "" : "/" + l}${p}` || base;
  return paths.flatMap((p) => routing.locales.map((l) => ({
    url: url(l, p) || base, lastModified: new Date(),
    alternates: { languages: Object.fromEntries(routing.locales.map((x) => [x, url(x, p) || base])) },
  })));
}

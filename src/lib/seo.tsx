import type { Metadata } from "next";
import { getSetting, L } from "@/lib/data";

type SeoMap = Record<string, { title_fr?: string; title_ar?: string; title_en?: string; description_fr?: string; description_ar?: string; description_en?: string; og_image?: string }>;

/** Page metadata: admin-defined SEO (Settings → SEO) wins over the defaults passed in. */
export async function pageMeta(page: string, locale: string, fallback: { title: string; description?: string; image?: string | null }): Promise<Metadata> {
  const seo = (await getSetting<SeoMap>("seo", {}))[page];
  const title = (seo && L(seo, "title", locale)) || fallback.title;
  const description = (seo && L(seo, "description", locale)) || fallback.description;
  const image = seo?.og_image || fallback.image || undefined;
  return { title, description, openGraph: { title, description, images: image ? [image] : undefined }, alternates: { languages: { fr: `/fr`, ar: `/ar`, en: `/en` } } };
}

export const siteUrl = () => process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

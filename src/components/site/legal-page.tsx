import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui";
import { getSetting, L } from "@/lib/data";
import { toHtml } from "@/lib/sanitize";

type Legal = Record<string, string>;

/** Legal text is edited with the rich-text editor in Admin → Settings → Legal pages. */
export default async function LegalPage({ kind, locale }: { kind: "terms" | "privacy"; locale: string }) {
  const t = await getTranslations({ locale, namespace: "footer" });
  const legal = await getSetting<Legal>("legal", {});
  const html = toHtml(L(legal, kind, locale));
  return (
    <Container className="max-w-3xl py-12">
      {html ? <div className="rich leading-relaxed text-muted-foreground" dangerouslySetInnerHTML={{ __html: html }} /> : <h1 className="text-3xl font-extrabold">{t(kind)}</h1>}
    </Container>
  );
}

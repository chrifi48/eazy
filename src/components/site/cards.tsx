import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { icons } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Badge, buttonClass, Card } from "@/components/ui";
import { L } from "@/lib/data";
import { formatMoney } from "@/lib/format";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any;

export function DynIcon({ name, className }: { name?: string | null; className?: string }) {
  const I = (name && (icons as Record<string, React.ComponentType<{ className?: string }>>)[name]) || icons.Layers;
  return <I className={className} />;
}

export function Thumb({ src, alt, className }: { src?: string | null; alt: string; className?: string }) {
  return (
    <div className={`relative aspect-[16/10] w-full overflow-hidden bg-gradient-to-br from-primary/15 to-accent/15 ${className ?? ""}`}>
      {src ? <Image src={src} alt={alt} fill unoptimized={src.endsWith(".svg")} sizes="(max-width:768px) 100vw, 33vw" className="object-cover transition duration-500 group-hover:scale-105" /> : (
        <div className="grid h-full place-items-center text-4xl font-black text-primary/30">{alt.slice(0, 1)}</div>
      )}
    </div>
  );
}

export async function TemplateCard({ tpl, locale }: { tpl: Row; locale: string }) {
  const t = await getTranslations({ locale });
  const types: string[] = (tpl.template_project_types ?? []).map((x: Row) => x.project_types?.slug).filter(Boolean);
  return (
    <Card className="group flex flex-col overflow-hidden transition duration-300 hover:-translate-y-2 hover:border-accent/60 hover:shadow-2xl">
      <Link href={`/models/${tpl.slug}`} className="block overflow-hidden"><Thumb src={tpl.thumbnail_url} alt={L(tpl, "name", locale)} /></Link>
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex flex-wrap gap-1.5">
          {tpl.categories && <Badge>{L(tpl.categories, "name", locale)}</Badge>}
          {types.map((s) => (<Badge key={s} className="bg-accent/10 text-accent dark:bg-accent/20">{t.has(`types.${s}`) ? t(`types.${s}`) : s}</Badge>))}
        </div>
        <h3 className="text-lg font-bold">{L(tpl, "name", locale)}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{L(tpl, "short_desc", locale)}</p>
        <p className="mt-3 text-sm text-muted-foreground">{t("common.from")} <span className="text-base font-bold text-foreground">{formatMoney(Number(tpl.price_min), locale)}</span></p>
        <div className="mt-4 flex gap-2 pt-1">
          <Link href={`/models/${tpl.slug}`} className={buttonClass("outline", "flex-1 !px-3")}>{t("common.preview")}</Link>
          <Link href={`/start?template=${tpl.slug}`} className={buttonClass("primary", "flex-1 !px-3")}>{t("common.choose")}</Link>
        </div>
      </div>
    </Card>
  );
}

export const TEMPLATE_SELECT = "*, categories(id,slug,name_fr,name_ar,name_en), template_project_types(project_types(slug))";

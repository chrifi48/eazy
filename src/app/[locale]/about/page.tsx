import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { buttonClass, Card, Container, SectionTitle } from "@/components/ui";
import { Badge } from "@/components/ui";
import { pageMeta } from "@/lib/seo";

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale, namespace: "about" });
  return pageMeta("about", locale, { title: t("title"), description: t("whoText").slice(0, 160) });
}

const skills = ["Next.js", "React", "TypeScript", "Node.js", "Supabase / PostgreSQL", "React Native", "Electron", "Tailwind CSS"];

export default async function AboutPage({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale, namespace: "about" });
  const tc = await getTranslations({ locale, namespace: "nav" });
  const steps = t.raw("processSteps") as string[];
  const values = t.raw("valuesList") as string[];
  return (
    <Container className="max-w-5xl py-12">
      <h1 className="text-3xl font-extrabold sm:text-4xl">{t("title")}</h1>
      <h2 className="mt-8 text-xl font-bold">{t("who")}</h2>
      <p className="mt-2 max-w-3xl text-lg text-muted-foreground">{t("whoText")}</p>

      <h2 className="mt-12 text-xl font-bold">{t("skills")}</h2>
      <div className="mt-3 flex flex-wrap gap-2">{skills.map((s) => (<Badge key={s} className="px-3 py-1 text-sm">{s}</Badge>))}</div>

      <h2 className="mt-12 text-xl font-bold">{t("experience")}</h2>
      <p className="mt-2 max-w-3xl text-muted-foreground">{t("experienceText")}</p>

      <div className="mt-12"><SectionTitle title={t("process")} /></div>
      <ol className="grid gap-4 md:grid-cols-4">{steps.map((s, i) => (<li key={s}><Card className="h-full p-5"><span className="mb-3 grid h-9 w-9 place-items-center rounded-full bg-accent text-sm font-bold text-white">{i + 1}</span><p className="font-semibold">{s}</p></Card></li>))}</ol>

      <div className="mt-12"><SectionTitle title={t("values")} /></div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{values.map((v) => (<Card key={v} className="p-5 text-center font-semibold">{v}</Card>))}</div>

      <Link href="/start" className={buttonClass("accent", "mt-12 px-8 py-3")}>{tc("start")}</Link>
    </Container>
  );
}

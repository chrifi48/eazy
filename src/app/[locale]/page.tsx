import { getTranslations } from "next-intl/server";
import { ArrowRight, Check } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Badge, buttonClass, Card, Container, SectionTitle } from "@/components/ui";
import { DynIcon, TemplateCard, TEMPLATE_SELECT, Thumb } from "@/components/site/cards";
import { HeroBackdrop, HeroText, Item, Reveal, Stagger } from "@/components/site/motion";
import { TestimonialSlider } from "@/components/site/client-bits";
import { getContact, getSetting, L, pub, safe, whatsappLink } from "@/lib/data";
import { formatMoney } from "@/lib/format";
import { JsonLd, pageMeta, siteUrl } from "@/lib/seo";
import { MessageCircle } from "lucide-react";

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale, namespace: "home" });
  return pageMeta("home", locale, { title: "eazy — " + t("heroTitle").slice(0, 60), description: t("heroSubtitle") });
}

type HomeTexts = Record<string, string>;

export default async function HomePage({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale });
  const sb = pub();
  const [home, contact, types, cats, featured, projects, testis, packages, faqs] = await Promise.all([
    getSetting<HomeTexts>("home", {}),
    getContact(),
    safe(() => sb.from("project_types").select("*").eq("is_active", true).order("sort_order"), []),
    safe(() => sb.from("categories").select("*").eq("is_active", true).order("sort_order").limit(6), []),
    safe(() => sb.from("templates").select(TEMPLATE_SELECT).eq("is_active", true).eq("is_featured", true).order("sort_order").limit(6), []),
    safe(() => sb.from("portfolio_projects").select("*").eq("is_published", true).order("created_at", { ascending: false }).limit(3), []),
    safe(() => sb.from("testimonials").select("*").eq("is_published", true).order("sort_order"), []),
    safe(() => sb.from("packages").select("*").eq("is_active", true).eq("kind", "project").is("category_id", null).order("sort_order"), []),
    safe(() => sb.from("faqs").select("*").eq("is_active", true).order("sort_order"), []),
  ]);
  const wa = whatsappLink(contact.whatsapp);
  const steps = t.raw("home.steps") as { t: string; d: string }[];

  return (
    <>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "LocalBusiness", name: "eazy", url: siteUrl(), address: { "@type": "PostalAddress", addressLocality: "Rabat", addressCountry: "MA" }, email: contact.email, telephone: contact.phone }} />
      {faqs.length > 0 && (
        <JsonLd data={{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map((f) => ({ "@type": "Question", name: L(f, "question", locale), acceptedAnswer: { "@type": "Answer", text: L(f, "answer", locale) } })) }} />
      )}

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <HeroBackdrop />
        <Container className="relative py-24 sm:py-32">
          <HeroText><div className="max-w-3xl">
            <h1 className="text-balance text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl [&]:bg-gradient-to-r [&]:from-foreground [&]:to-primary [&]:bg-clip-text [&]:text-transparent dark:[&]:to-blue-300">{L(home, "hero_title", locale) || t("home.heroTitle")}</h1>
            <p className="mt-6 max-w-2xl text-lg text-muted-foreground">{L(home, "hero_subtitle", locale) || t("home.heroSubtitle")}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/start" className={buttonClass("accent", "px-7 py-3 text-base")}>{L(home, "cta_primary", locale) || t("nav.start")}<ArrowRight className="h-4 w-4 rtl:rotate-180" /></Link>
              <Link href="/models" className={buttonClass("outline", "px-7 py-3 text-base")}>{L(home, "cta_secondary", locale) || t("common.seeModels")}</Link>
            </div>
          </div></HeroText>
        </Container>
      </section>

      {/* Project types */}
      <Container className="-mt-10 relative z-10">
        <Stagger className="grid gap-4 md:grid-cols-3">
          {types.map((p) => (
            <Item key={p.id}><Link href={`/start?type=${p.slug}`} className="block h-full">
              <Card className="group flex h-full items-start gap-4 p-6 transition duration-300 hover:-translate-y-2 hover:border-accent hover:shadow-2xl">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary transition group-hover:scale-110 group-hover:bg-accent group-hover:text-white dark:text-blue-300"><DynIcon name={p.icon} className="h-6 w-6" /></span>
                <div><h3 className="text-lg font-bold">{L(p, "name", locale)}</h3><p className="mt-1 text-sm text-muted-foreground">{L(p, "description", locale) || t(`home.typeDesc.${p.slug}`)}</p></div>
              </Card>
            </Link></Item>
          ))}
        </Stagger>
      </Container>

      {/* Popular categories */}
      {cats.length > 0 && (
        <Container className="mt-20">
          <SectionTitle title={t("home.popular")} action={<Link href="/models" className="text-sm font-semibold text-accent">{t("common.viewAll")}</Link>} />
          <Stagger className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6" step={0.06}>
            {cats.map((c) => (
              <Item key={c.id}><Link href={`/models?category=${c.slug}`} className="group block h-full rounded-2xl border border-border bg-card p-5 text-center transition hover:-translate-y-1 hover:border-accent hover:shadow-soft">
                <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl bg-accent/10 text-accent"><DynIcon name={c.icon} className="h-6 w-6" /></span>
                <span className="text-sm font-semibold">{L(c, "name", locale)}</span>
              </Link></Item>
            ))}
          </Stagger>
        </Container>
      )}

      {/* How it works */}
      <Container className="mt-20">
        <SectionTitle title={t("home.howTitle")} />
        <Stagger className="grid gap-4 md:grid-cols-4"><ol className="contents">
          {steps.map((s, i) => (
            <Item key={i}><li><Card className="h-full p-6 transition duration-300 hover:-translate-y-1 hover:shadow-xl"><span className="mb-4 grid h-10 w-10 place-items-center rounded-full bg-accent text-sm font-bold text-white">{i + 1}</span><h3 className="font-bold">{s.t}</h3><p className="mt-1 text-sm text-muted-foreground">{s.d}</p></Card></li></Item>
          ))}
        </ol></Stagger>
      </Container>

      {/* Featured templates */}
      {featured.length > 0 && (
        <Container className="mt-20">
          <SectionTitle title={t("home.featured")} action={<Link href="/models" className="text-sm font-semibold text-accent">{t("common.viewAll")}</Link>} />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{await Promise.all(featured.map((tp) => <TemplateCard key={tp.id} tpl={tp} locale={locale} />))}</div>
        </Container>
      )}

      {/* Portfolio */}
      {projects.length > 0 && (
        <Container className="mt-20">
          <SectionTitle title={t("home.portfolio")} action={<Link href="/portfolio" className="text-sm font-semibold text-accent">{t("common.viewAll")}</Link>} />
          <div className="grid gap-6 md:grid-cols-3">
            {projects.map((p) => (
              <Link key={p.id} href={`/portfolio/${p.slug}`}>
                <Card className="group overflow-hidden transition hover:-translate-y-1 hover:shadow-xl">
                  <Thumb src={p.images?.[0]} alt={L(p, "title", locale)} />
                  <div className="p-5"><h3 className="font-bold">{L(p, "title", locale)}</h3><p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{L(p, "description", locale)}</p></div>
                </Card>
              </Link>
            ))}
          </div>
        </Container>
      )}

      {/* Testimonials */}
      {testis.length > 0 && (
        <section className="mt-20 bg-muted/60 py-16">
          <Container>
            <SectionTitle title={t("home.testimonials")} />
            <TestimonialSlider items={testis.map((x) => ({ id: x.id, name: x.client_name, business: x.business, photo: x.photo_url, text: L(x, "text", locale), rating: x.rating }))} />
          </Container>
        </section>
      )}

      {/* Pricing preview */}
      {packages.length > 0 && (
        <Container className="mt-20">
          <SectionTitle title={t("home.pricing")} action={<Link href="/pricing" className="text-sm font-semibold text-accent">{t("common.viewAll")}</Link>} />
          <div className="grid gap-6 md:grid-cols-3">
            {packages.map((p) => (
              <Card key={p.id} className={`p-6 ${p.is_highlighted ? "border-accent ring-2 ring-accent/30" : ""}`}>
                {p.is_highlighted && <Badge className="mb-3 bg-accent text-white">{t("pricing.highlight")}</Badge>}
                <h3 className="text-xl font-bold">{L(p, "name", locale)}</h3>
                <p className="mt-2 text-3xl font-extrabold">{formatMoney(Number(p.price), locale)}</p>
                <p className="text-xs text-muted-foreground">{t("common.from")}</p>
                <ul className="mt-4 space-y-2 text-sm">
                  {((p[`items_${locale}`]?.length ? p[`items_${locale}`] : p.items_fr) as string[]).slice(0, 5).map((it) => (<li key={it} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />{it}</li>))}
                </ul>
              </Card>
            ))}
          </div>
        </Container>
      )}

      {/* FAQ */}
      {faqs.length > 0 && (
        <Container className="mt-20 max-w-3xl">
          <SectionTitle title={t("home.faq")} />
          <div className="divide-y divide-border rounded-2xl border border-border bg-card">
            {faqs.map((f) => (
              <details key={f.id} className="group p-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">{L(f, "question", locale)}<span className="text-accent transition group-open:rotate-45">+</span></summary>
                <p className="mt-3 whitespace-pre-line text-muted-foreground">{L(f, "answer", locale)}</p>
              </details>
            ))}
          </div>
        </Container>
      )}

      {/* Final CTA */}
      <Container className="mt-20">
        <Reveal className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-blue-700 px-6 py-16 text-center text-white sm:px-12"><div aria-hidden className="animate-floaty absolute -end-10 -top-10 h-48 w-48 rounded-full bg-accent/30 blur-2xl" /><div className="relative">
          <h2 className="text-3xl font-extrabold">{t("home.ctaTitle")}</h2>
          <p className="mx-auto mt-3 max-w-xl text-white/80">{t("home.ctaText")}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/start" className={buttonClass("accent", "px-7 py-3 text-base")}>{t("nav.start")}</Link>
            {wa && <a href={wa} target="_blank" rel="noopener noreferrer" className={buttonClass("outline", "border-white/30 bg-white/10 px-7 py-3 text-base text-white hover:bg-white/20")}><MessageCircle className="h-4 w-4" />{t("common.whatsapp")}</a>}
          </div>
        </div></Reveal>
      </Container>
    </>
  );
}

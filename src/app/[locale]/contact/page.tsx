import { getTranslations } from "next-intl/server";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { Card, Container } from "@/components/ui";
import ContactForm from "@/components/site/contact-form";
import { getContact, whatsappLink } from "@/lib/data";
import { pageMeta } from "@/lib/seo";

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale, namespace: "contact" });
  return pageMeta("contact", locale, { title: t("title"), description: t("subtitle") });
}

export default async function ContactPage({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale, namespace: "contact" });
  const c = await getContact();
  const address = c.address || "Rabat, Maroc";
  const wa = whatsappLink(c.whatsapp);
  const social = Object.entries(c.social ?? {}).filter(([, v]) => v);
  return (
    <Container className="py-12">
      <h1 className="text-3xl font-extrabold sm:text-4xl">{t("title")}</h1>
      <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
      <div className="mt-8 grid gap-8 lg:grid-cols-5">
        <Card className="p-6 lg:col-span-3"><ContactForm /></Card>
        <div className="space-y-4 lg:col-span-2">
          <Card className="space-y-3 p-6 text-sm">
            <h2 className="font-bold">{t("info")}</h2>
            {c.email && <a href={`mailto:${c.email}`} className="flex items-center gap-3 hover:text-accent"><Mail className="h-4 w-4" />{c.email}</a>}
            {c.phone && <a href={`tel:${c.phone}`} dir="ltr" className="flex items-center gap-3 hover:text-accent"><Phone className="h-4 w-4" />{c.phone}</a>}
            {wa && <a href={wa} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 hover:text-accent"><MessageCircle className="h-4 w-4" />WhatsApp</a>}
            <p className="flex items-center gap-3"><MapPin className="h-4 w-4" />{address}</p>
            {social.length > 0 && <p className="flex flex-wrap gap-3 pt-2">{social.map(([k, v]) => (<a key={k} href={v} target="_blank" rel="noopener noreferrer" className="capitalize text-accent">{k}</a>))}</p>}
          </Card>
          <div className="overflow-hidden rounded-2xl border border-border">
            <iframe title="Map" loading="lazy" className="h-64 w-full" src={`https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`} />
          </div>
        </div>
      </div>
    </Container>
  );
}

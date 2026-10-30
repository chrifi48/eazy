import { getTranslations } from "next-intl/server";
import { CheckCircle2, MessageCircle } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { buttonClass, Card, Container } from "@/components/ui";
import { getContact, whatsappLink } from "@/lib/data";

export const metadata = { robots: { index: false } };

export default async function SuccessPage({ params: { locale }, searchParams }: { params: { locale: string }; searchParams: { ref?: string } }) {
  const t = await getTranslations({ locale, namespace: "success" });
  const ref = (searchParams.ref ?? "").replace(/[^A-Z0-9-]/gi, "").slice(0, 20);
  const contact = await getContact();
  const wa = whatsappLink(contact.whatsapp, `Bonjour, ma référence : ${ref}`);
  return (
    <Container className="py-20">
      <Card className="mx-auto max-w-lg p-10 text-center">
        <CheckCircle2 className="mx-auto h-14 w-14 text-green-500" />
        <h1 className="mt-4 text-3xl font-extrabold">{t("title")}</h1>
        <p className="mt-6 text-sm text-muted-foreground">{t("ref")}</p>
        <p className="mt-1 text-3xl font-black tracking-wider text-primary dark:text-blue-300" dir="ltr">{ref}</p>
        <p className="mt-6 text-muted-foreground">{t("text")}</p>
        <div className="mt-8 flex flex-col gap-3">
          {wa && <a href={wa} target="_blank" rel="noopener noreferrer" className={buttonClass("accent")}><MessageCircle className="h-4 w-4" />{t("whatsapp")}</a>}
          <Link href="/" className={buttonClass("outline")}>{t("home")}</Link>
        </div>
      </Card>
    </Container>
  );
}

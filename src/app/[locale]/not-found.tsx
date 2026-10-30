import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { buttonClass, Container } from "@/components/ui";

export default function NotFound() {
  const t = useTranslations();
  return (
    <Container className="py-32 text-center">
      <p className="text-7xl font-black text-accent">404</p>
      <h1 className="mt-4 text-2xl font-bold">{t("notFound")}</h1>
      <Link href="/" className={buttonClass("primary", "mt-8")}>{t("nav.home")}</Link>
    </Container>
  );
}

import LegalPage from "@/components/site/legal-page";

export const metadata = { title: "Privacy" };
export default function Page({ params: { locale } }: { params: { locale: string } }) {
  return <LegalPage kind="privacy" locale={locale} />;
}

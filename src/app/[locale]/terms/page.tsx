import LegalPage from "@/components/site/legal-page";

export const metadata = { title: "Terms" };
export default function Page({ params: { locale } }: { params: { locale: string } }) {
  return <LegalPage kind="terms" locale={locale} />;
}

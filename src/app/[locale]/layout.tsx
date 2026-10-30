import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { ThemeProvider } from "next-themes";
import { MessageCircle } from "lucide-react";
import { routing } from "@/i18n/routing";
import { inter, cairo } from "@/lib/fonts";
import { brandVars } from "@/lib/brand";
import { getContact, getSetting, whatsappLink } from "@/lib/data";
import Header from "@/components/site/header";
import Footer from "@/components/site/footer";
import "../globals.css";

type Brand = { name?: string; primary?: string; accent?: string; logo?: string; favicon?: string };

export async function generateMetadata(): Promise<Metadata> {
  const brand = await getSetting<Brand>("brand", {});
  const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return {
    metadataBase: new URL(site),
    title: { default: `${brand.name || "eazy"} — Web, Mobile & Desktop`, template: `%s | ${brand.name || "eazy"}` },
    description: "Choose your model, get your price, launch your project.",
    icons: brand.favicon ? { icon: brand.favicon } : undefined,
  };
}

export default async function LocaleLayout({ children, params: { locale } }: { children: React.ReactNode; params: { locale: string } }) {
  if (!routing.locales.includes(locale as never)) notFound();
  const [messages, brand, contact, maintenance] = await Promise.all([
    getMessages(), getSetting<Brand>("brand", {}), getContact(), getSetting<boolean>("maintenance_mode", false),
  ]);
  const t = await getTranslations({ locale, namespace: "maintenance" });
  const wa = whatsappLink(contact.whatsapp);

  return (
    <html lang={locale} translate="no" dir={locale === "ar" ? "rtl" : "ltr"} style={brandVars(brand)} suppressHydrationWarning>
      <body className={`${inter.variable} ${cairo.variable}`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <NextIntlClientProvider messages={messages} locale={locale}>
            {maintenance === true ? (
              <main className="grid min-h-screen place-items-center p-6 text-center">
                <div><h1 className="text-3xl font-bold">{t("title")}</h1><p className="mt-3 text-muted-foreground">{t("text")}</p></div>
              </main>
            ) : (
              <>
                <Header brandName={brand.name || "eazy"} logo={brand.logo} />
                <main id="main">{children}</main>
                <Footer brandName={brand.name || "eazy"} contact={contact} />
                {wa && (
                  <a href={wa} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp"
                    className="fixed bottom-4 end-4 z-50 grid h-12 w-12 sm:bottom-5 sm:end-5 sm:h-14 sm:w-14 place-items-center rounded-full bg-[#25D366] text-white shadow-lg transition hover:scale-105">
                    <MessageCircle className="h-6 w-6 sm:h-7 sm:w-7" />
                  </a>
                )}
              </>
            )}
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

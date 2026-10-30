import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { Contact } from "@/lib/data";

export default function Footer({ brandName, contact }: { brandName: string; contact: Contact }) {
  const t = useTranslations();
  const social = Object.entries(contact.social ?? {}).filter(([, v]) => v);
  return (
    <footer className="mt-24 border-t border-border bg-muted/50">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <p className="text-xl font-extrabold text-primary dark:text-blue-400">{brandName}<span className="text-accent">.</span></p>
          <p className="mt-3 max-w-sm text-sm text-muted-foreground">{t("footer.tagline")}</p>
          <ul className="mt-4 space-y-1 text-sm text-muted-foreground">
            {contact.email && <li><a className="hover:text-foreground" href={`mailto:${contact.email}`}>{contact.email}</a></li>}
            {contact.phone && <li><a className="hover:text-foreground" href={`tel:${contact.phone}`} dir="ltr">{contact.phone}</a></li>}
            <li>{contact.address || "Rabat, Maroc"}</li>
          </ul>
        </div>
        <div>
          <p className="mb-3 text-sm font-semibold">{t("footer.links")}</p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {([["/models", "models"], ["/pricing", "pricing"], ["/portfolio", "portfolio"], ["/about", "about"], ["/contact", "contact"]] as const).map(([h, k]) => (
              <li key={h}><Link href={h} className="hover:text-foreground">{t(`nav.${k}`)}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-3 text-sm font-semibold">{t("footer.legal")}</p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link href="/terms" className="hover:text-foreground">{t("footer.terms")}</Link></li>
            <li><Link href="/privacy" className="hover:text-foreground">{t("footer.privacy")}</Link></li>
          </ul>
          {social.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-3 text-sm text-muted-foreground">
              {social.map(([k, v]) => (<li key={k}><a href={v} target="_blank" rel="noopener noreferrer" className="capitalize hover:text-foreground">{k}</a></li>))}
            </ul>
          )}
        </div>
      </div>
      <p className="border-t border-border px-4 pb-20 pt-4 text-center sm:pb-4 text-xs text-muted-foreground">© {new Date().getFullYear()} {brandName}. {t("footer.rights")}</p>
    </footer>
  );
}

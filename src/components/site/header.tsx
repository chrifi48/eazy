"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { Menu, Moon, Sun, X } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { buttonClass } from "@/components/ui";
import { cn } from "@/lib/utils";

const links = [["/", "home"], ["/models", "models"], ["/pricing", "pricing"], ["/portfolio", "portfolio"], ["/about", "about"], ["/contact", "contact"]] as const;
const langs = [["fr", "FR"], ["ar", "AR"], ["en", "EN"]] as const;

export default function Header({ brandName, logo }: { brandName: string; logo?: string }) {
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 text-xl font-extrabold tracking-tight">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {logo ? <img src={logo} alt={brandName} className="h-8 w-auto" /> : <span className="text-primary dark:text-blue-400">{brandName}<span className="text-accent">.</span></span>}
        </Link>
        <nav className="ms-6 hidden items-center gap-1 lg:flex" aria-label="Main">
          {links.map(([href, key]) => (
            <Link key={href} href={href} className={cn("rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-muted", pathname === href && "text-accent")}>{t(`nav.${key}`)}</Link>
          ))}
        </nav>
        <div className="ms-auto flex items-center gap-2">
          <div className="hidden items-center rounded-xl border border-border p-0.5 sm:flex" role="group" aria-label={t("common.language")}>
            {langs.map(([l, label]) => (
              <Link key={l} href={pathname} locale={l} aria-current={l === locale} className={cn("rounded-lg px-2 py-1 text-xs font-semibold", l === locale ? "bg-primary text-white" : "hover:bg-muted")}>{label}</Link>
            ))}
          </div>
          <button onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")} aria-label={t("common.theme")} className="grid h-9 w-9 place-items-center rounded-xl border border-border hover:bg-muted">
            <Sun className="hidden h-4 w-4 dark:block" /><Moon className="h-4 w-4 dark:hidden" />
          </button>
          <Link href="/start" className={buttonClass("accent", "hidden sm:inline-flex")}>{t("nav.start")}</Link>
          <button className="grid h-9 w-9 place-items-center rounded-xl border border-border lg:hidden" onClick={() => setOpen(!open)} aria-expanded={open} aria-label="Menu">
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>
      {open && (
        <div className="border-t border-border bg-background px-4 pb-4 lg:hidden">
          <nav className="flex flex-col py-2">
            {links.map(([href, key]) => (<Link key={href} href={href} onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 text-sm font-medium hover:bg-muted">{t(`nav.${key}`)}</Link>))}
          </nav>
          <div className="mb-3 flex gap-2">
            {langs.map(([l, label]) => (<Link key={l} href={pathname} locale={l} className={cn("rounded-lg border border-border px-3 py-1.5 text-xs font-semibold", l === locale && "bg-primary text-white")}>{label}</Link>))}
          </div>
          <Link href="/start" onClick={() => setOpen(false)} className={buttonClass("accent", "w-full")}>{t("nav.start")}</Link>
        </div>
      )}
    </header>
  );
}

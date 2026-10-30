"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { CalendarClock, CalendarDays, FileText, Globe, HelpCircle, Inbox, Layers, LayoutDashboard, MessageSquareQuote, Package, Settings, Shapes, ShieldCheck, Sparkles, Tags, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  ["Dashboard", "/admin", LayoutDashboard], ["Requests", "/admin/requests", Inbox], ["Appointments", "/admin/appointments", CalendarDays], ["Availability", "/admin/availability", CalendarClock],
  ["Project types", "/admin/project-types", Globe], ["Categories", "/admin/categories", Shapes], ["Templates", "/admin/templates", Layers], ["Feature groups", "/admin/feature-groups", Tags],
  ["Features", "/admin/features", Sparkles], ["Packages", "/admin/packages", Package], ["Portfolio", "/admin/portfolio", Briefcase], ["Testimonials", "/admin/testimonials", MessageSquareQuote],
  ["FAQ", "/admin/faq", HelpCircle], ["Messages", "/admin/messages", FileText], ["Settings", "/admin/settings", Settings], ["Account", "/admin/account", ShieldCheck],
] as const;

export default function Sidebar() {
  const path = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto md:flex-col" aria-label="Admin">
      {nav.map(([label, href, Icon]) => {
        const active = href === "/admin" ? path === href : path.startsWith(href);
        return (
          <Link key={href} href={href} className={cn("relative flex items-center gap-2.5 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium transition-colors", active ? "text-white" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
            {active && <motion.span layoutId="admin-active" className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary to-blue-600 shadow-md" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
            <Icon className="relative h-4 w-4" /><span className="relative">{label}</span>
          </Link>
        );
      })}
      <a href="/" target="_blank" className="flex items-center gap-2.5 whitespace-nowrap rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-muted"><Globe className="h-4 w-4" />View site ↗</a>
    </nav>
  );
}

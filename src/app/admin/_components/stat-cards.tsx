"use client";

import { useEffect } from "react";
import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { CalendarClock, CircleDollarSign, Inbox, Percent, TrendingUp } from "lucide-react";

const icons = [Inbox, CalendarClock, TrendingUp, Percent, CircleDollarSign];
const tint = ["from-blue-500 to-blue-700", "from-orange-400 to-orange-600", "from-emerald-500 to-emerald-700", "from-violet-500 to-violet-700", "from-sky-500 to-cyan-600"];

function Count({ value }: { value: number }) {
  const mv = useMotionValue(0);
  const text = useTransform(mv, (v) => Math.round(v).toLocaleString("fr-FR"));
  useEffect(() => { const c = animate(mv, value, { duration: 1.1, ease: "easeOut" }); return () => c.stop(); }, [value, mv]);
  return <motion.span>{text}</motion.span>;
}

/** value: a number animates; a string (e.g. "42%") is shown as-is. */
export default function StatCards({ stats }: { stats: { label: string; value: number | string; suffix?: string }[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-5">
      {stats.map((s, i) => {
        const Icon = icons[i % icons.length];
        return (
          <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07, duration: 0.45 }} whileHover={{ y: -4 }}
            className="relative overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-soft sm:p-5 [&:last-child:nth-child(odd)]:col-span-2 lg:[&:last-child:nth-child(odd)]:col-span-1">
            <span className={`absolute -end-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br ${tint[i % tint.length]} opacity-15`} />
            <span className={`mb-3 grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${tint[i % tint.length]} text-white shadow`}><Icon className="h-5 w-5" /></span>
            <p className="text-sm text-muted-foreground">{s.label}</p>
            <p className="mt-1 text-2xl font-bold">{typeof s.value === "number" ? <><Count value={s.value} />{s.suffix}</> : s.value}</p>
          </motion.div>
        );
      })}
    </div>
  );
}

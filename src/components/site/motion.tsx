"use client";

import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";

/** Fades/slides content in when it scrolls into view. */
export function Reveal({ children, delay = 0, y = 24, className, ...rest }: { children: React.ReactNode; delay?: number; y?: number; className?: string } & Omit<HTMLMotionProps<"div">, "children">) {
  const reduce = useReducedMotion();
  return (
    <motion.div className={className} initial={reduce ? false : { opacity: 0, y }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }} {...rest}>
      {children}
    </motion.div>
  );
}

/** Children appear one after the other. */
export function Stagger({ children, className, step = 0.08 }: { children: React.ReactNode; className?: string; step?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div className={className} initial={reduce ? false : "hidden"} whileInView="show" viewport={{ once: true, margin: "-60px" }} variants={{ hidden: {}, show: { transition: { staggerChildren: step } } }}>
      {children}
    </motion.div>
  );
}

export function Item({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div className={`h-full ${className ?? ""}`} variants={{ hidden: { opacity: 0, y: 24, scale: 0.97 }, show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } } }}>
      {children}
    </motion.div>
  );
}

/** Animated gradient blobs + grid for hero sections. */
export function HeroBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-0 overflow-hidden">
      <div className="animate-blob absolute -start-20 -top-24 h-96 w-96 rounded-full bg-primary/25 blur-3xl" />
      <div className="animate-blob absolute -end-16 top-10 h-96 w-96 rounded-full bg-accent/25 blur-3xl [animation-delay:-5s]" />
      <div className="animate-blob absolute bottom-[-6rem] start-1/3 h-80 w-80 rounded-full bg-sky-400/20 blur-3xl [animation-delay:-9s]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/.5)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/.5)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
    </div>
  );
}

/** Hero text entrance. */
export function HeroText({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <motion.div initial={reduce ? false : { opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </motion.div>
  );
}

import * as React from "react";
import { cn } from "@/lib/utils";

const base = "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";
const variants = {
  primary: "bg-primary text-white hover:bg-primary/90 hover:shadow-soft dark:bg-blue-600",
  accent: "bg-accent text-white hover:bg-accent/90 hover:shadow-soft",
  outline: "border border-border bg-card hover:bg-muted",
  ghost: "hover:bg-muted",
  danger: "bg-red-600 text-white hover:bg-red-700",
};
export const buttonClass = (variant: keyof typeof variants = "primary", className?: string) => cn(base, variants[variant], className);

export const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof variants }>(
  ({ variant = "primary", className, ...p }, ref) => <button ref={ref} className={buttonClass(variant, className)} {...p} />,
);
Button.displayName = "Button";

const field = "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent";
export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...p }, ref) => <input ref={ref} className={cn(field, className)} {...p} />);
Input.displayName = "Input";
export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...p }, ref) => <textarea ref={ref} rows={4} className={cn(field, className)} {...p} />);
Textarea.displayName = "Textarea";
export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(({ className, ...p }, ref) => <select ref={ref} className={cn(field, className)} {...p} />);
Select.displayName = "Select";

export function Field({ label, children, error, hint, className }: { label: string; children: React.ReactNode; error?: string; hint?: string; className?: string }) {
  return (
    <label className={cn("block text-sm font-medium", className)}>
      <span className="mb-1 block">{label}</span>
      {hint && <span className="mb-1 block text-xs font-normal text-muted-foreground">{hint}</span>}
      {children}
      {error && <span role="alert" className="mt-1 block text-xs font-normal text-red-600">{error}</span>}
    </label>
  );
}

export const Card = ({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("rounded-2xl border border-border bg-card shadow-soft", className)} {...p} />
);

export const Badge = ({ className, ...p }: React.HTMLAttributes<HTMLSpanElement>) => (
  <span className={cn("inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary dark:bg-blue-500/20 dark:text-blue-300", className)} {...p} />
);

export const Container = ({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) => <div className={cn("mx-auto w-full max-w-7xl px-4 sm:px-6", className)} {...p} />;

export function SectionTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h2>
        {subtitle && <p className="mt-2 text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

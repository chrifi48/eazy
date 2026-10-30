"use client";

import { useFormState, useFormStatus } from "react-dom";
import { motion } from "framer-motion";
import { KeyRound, Lock, Mail } from "lucide-react";
import { HeroBackdrop } from "@/components/site/motion";
import { signIn, verifyTwoFactor } from "../../actions";

function Submit({ label, busy }: { label: string; busy: string }) {
  const { pending } = useFormStatus();
  return (
    <button disabled={pending} className="w-full rounded-xl bg-gradient-to-r from-primary to-blue-600 py-3 font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 disabled:opacity-60">
      {pending ? busy : label}
    </button>
  );
}

const input = "w-full rounded-xl border border-border bg-background/80 py-2.5 pe-3 ps-10 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30";

export default function LoginPage() {
  const [pw, passwordAction] = useFormState(signIn, undefined);
  const [tf, twoFactorAction] = useFormState(verifyTwoFactor, undefined);
  const step2 = pw?.step === "2fa" || tf?.step === "2fa";
  const error = step2 ? tf?.error : pw?.error;

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      <HeroBackdrop />
      <motion.form key={step2 ? "2fa" : "pw"} action={step2 ? twoFactorAction : passwordAction} initial={{ opacity: 0, y: 24, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="glass relative w-full max-w-sm space-y-5 rounded-3xl p-8 shadow-2xl">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">eazy<span className="text-accent">.</span> <span className="text-lg font-medium text-muted-foreground">admin</span></h1>
          <p className="mt-1 text-sm text-muted-foreground">{step2 ? "Enter the 6-digit code from your authenticator app." : "Sign in to manage your site."}</p>
        </div>

        {step2 ? (
          <label className="block text-sm font-medium">Verification code
            <span className="relative mt-1 block"><KeyRound className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input name="code" required autoFocus autoComplete="one-time-code" inputMode="text" placeholder="123456" className={`${input} tracking-widest`} dir="ltr" /></span>
            <span className="mt-1 block text-xs font-normal text-muted-foreground">Lost your phone? Enter one of your recovery codes instead.</span>
          </label>
        ) : (<>
          <label className="block text-sm font-medium">Email
            <span className="relative mt-1 block"><Mail className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input name="email" type="email" required autoComplete="username" className={input} /></span>
          </label>
          <label className="block text-sm font-medium">Password
            <span className="relative mt-1 block"><Lock className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input name="password" type="password" required autoComplete="current-password" className={input} /></span>
          </label>
        </>)}

        {error && <motion.p initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{error}</motion.p>}
        <Submit label={step2 ? "Verify" : "Sign in"} busy={step2 ? "Verifying…" : "Signing in…"} />
        {step2 && <a href="/admin/login" className="block text-center text-sm text-muted-foreground hover:text-foreground">← Back to sign in</a>}
      </motion.form>
    </main>
  );
}

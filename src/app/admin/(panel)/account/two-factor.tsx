"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { Button, Card, Field, Input } from "@/components/ui";
import { disableTwoFactor, enableTwoFactor, startTwoFactor } from "./two-factor-actions";

export default function TwoFactor({ enabled, recoveryLeft }: { enabled: boolean; recoveryLeft: number }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [setup, setSetup] = useState<{ qr: string; secret: string } | null>(null);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [codes, setCodes] = useState<string[] | null>(null);
  const [err, setErr] = useState("");

  const begin = () => start(async () => { setErr(""); const r = await startTwoFactor(); if (r.error) setErr(r.error); else setSetup({ qr: r.qr!, secret: r.secret! }); });
  const confirm = () => start(async () => { setErr(""); const r = await enableTwoFactor(code); if (r.error) setErr(r.error); else { setCodes(r.codes!); setSetup(null); setCode(""); router.refresh(); } });
  const disable = () => start(async () => { setErr(""); const r = await disableTwoFactor(password, code); if (r.error) setErr(r.error); else { setPassword(""); setCode(""); router.refresh(); } });

  return (
    <Card className="p-5 md:col-span-2">
      <h2 className="flex items-center gap-2 font-semibold"><ShieldCheck className="h-5 w-5 text-accent" />Two-factor authentication</h2>
      <p className="mt-1 text-sm text-muted-foreground">Asks for a 6-digit code from an app (Google Authenticator, Authy, 1Password…) after your password.</p>

      {codes && (
        <div className="mt-4 rounded-xl border border-accent/40 bg-accent/5 p-4">
          <p className="font-medium">Two-factor is on. Save these recovery codes now, they will not be shown again.</p>
          <p className="mb-3 text-sm text-muted-foreground">Each code works once if you lose your phone.</p>
          <ul className="grid grid-cols-2 gap-2 font-mono text-sm sm:grid-cols-4" dir="ltr">{codes.map((c) => (<li key={c} className="rounded-lg bg-background px-2 py-1 text-center">{c}</li>))}</ul>
          <Button variant="outline" className="mt-3" onClick={() => setCodes(null)}>I saved them</Button>
        </div>
      )}

      {!enabled && !setup && !codes && <Button className="mt-4" onClick={begin} disabled={pending}>Enable two-factor</Button>}

      {setup && (
        <div className="mt-4 grid gap-5 sm:grid-cols-[220px_1fr]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={setup.qr} alt="QR code to scan with your authenticator app" width={220} height={220} className="rounded-xl border border-border bg-white" />
          <div className="space-y-3">
            <p className="text-sm">1. Scan the QR code with your app (or type this key: <code className="select-all break-all rounded bg-muted px-1.5 py-0.5 text-xs" dir="ltr">{setup.secret}</code>).</p>
            <p className="text-sm">2. Enter the 6-digit code it shows:</p>
            <div className="flex gap-2">
              <Input inputMode="numeric" autoComplete="one-time-code" maxLength={7} value={code} onChange={(e) => setCode(e.target.value)} placeholder="123456" className="!w-36 text-center tracking-widest" dir="ltr" />
              <Button onClick={confirm} disabled={pending || code.replace(/\s/g, "").length < 6}>Confirm</Button>
              <Button variant="outline" onClick={() => setSetup(null)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}

      {enabled && !codes && (
        <div className="mt-4 space-y-3">
          <p className="text-sm font-medium text-green-600 dark:text-green-400">Enabled · {recoveryLeft} recovery code{recoveryLeft === 1 ? "" : "s"} left</p>
          <div className="grid max-w-xl gap-3 sm:grid-cols-2">
            <Field label="Password"><Input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
            <Field label="Current 6-digit code"><Input inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(e) => setCode(e.target.value)} dir="ltr" /></Field>
          </div>
          <Button variant="danger" onClick={disable} disabled={pending || !password || code.replace(/\s/g, "").length < 6}>Disable two-factor</Button>
        </div>
      )}
      {err && <p role="alert" className="mt-3 text-sm text-red-600">{err}</p>}
    </Card>
  );
}

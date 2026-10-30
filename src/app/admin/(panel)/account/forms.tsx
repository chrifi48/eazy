"use client";

import { useState } from "react";
import { Button, Card, Field, Input } from "@/components/ui";
import { changeEmail as saveEmail, changePassword as savePassword } from "./actions";
import { useRouter } from "next/navigation";
import TwoFactor from "./two-factor";

export default function AccountForms({ email, twoFactor }: { email: string; twoFactor: { enabled: boolean; recoveryLeft: number } }) {
  const router = useRouter();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [msg, setMsg] = useState({ pw: "", email: "" });

  async function changePassword() {
    if (pw.length < 10) return setMsg((m) => ({ ...m, pw: "Use at least 10 characters" }));
    if (pw !== pw2) return setMsg((m) => ({ ...m, pw: "Passwords do not match" }));
    const { error } = await savePassword(pw);
    setMsg((m) => ({ ...m, pw: error ?? "Password updated ✓" }));
    if (!error) { setPw(""); setPw2(""); }
  }
  async function changeEmail() {
    const { error } = await saveEmail(newEmail);
    setMsg((m) => ({ ...m, email: error ?? "Email updated ✓" }));
    if (!error) { setNewEmail(""); router.refresh(); }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="space-y-3 p-5">
        <h2 className="font-semibold">Change password</h2>
        <Field label="New password"><Input type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} /></Field>
        <Field label="Confirm password"><Input type="password" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} /></Field>
        <Button onClick={changePassword}>Update password</Button>
        {msg.pw && <p role="status" className="text-sm text-muted-foreground">{msg.pw}</p>}
      </Card>
      <Card className="space-y-3 p-5">
        <h2 className="font-semibold">Change email</h2>
        <p className="text-sm text-muted-foreground">Current: {email}</p>
        <Field label="New email"><Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} /></Field>
        <Button onClick={changeEmail} disabled={!newEmail}>Update email</Button>
        {msg.email && <p role="status" className="text-sm text-muted-foreground">{msg.email}</p>}
      </Card>
      <TwoFactor enabled={twoFactor.enabled} recoveryLeft={twoFactor.recoveryLeft} />
    </div>
  );
}

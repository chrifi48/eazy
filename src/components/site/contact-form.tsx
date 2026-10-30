"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button, Field, Input, Textarea } from "@/components/ui";

export default function ContactForm() {
  const t = useTranslations("contact");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("sending");
    const data = Object.fromEntries(new FormData(e.currentTarget));
    try {
      const res = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (res.ok) { setState("sent"); (e.target as HTMLFormElement).reset(); } else setState("error");
    } catch { setState("error"); }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("name")}><Input name="name" required minLength={2} autoComplete="name" /></Field>
        <Field label={t("email")}><Input name="email" type="email" required autoComplete="email" dir="ltr" /></Field>
      </div>
      <Field label={t("phone")}><Input name="phone" type="tel" autoComplete="tel" dir="ltr" /></Field>
      <Field label={t("message")}><Textarea name="message" required minLength={5} rows={6} /></Field>
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="absolute -left-[9999px] h-0 w-0 opacity-0" />
      <Button disabled={state === "sending"}>{t("send")}</Button>
      {state === "sent" && <p role="status" className="text-sm text-green-600">{t("sent")}</p>}
      {state === "error" && <p role="alert" className="text-sm text-red-600">{t("error")}</p>}
    </form>
  );
}

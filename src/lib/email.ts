import "server-only";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/backend/admin";

export type EmailKey = "client_confirmation" | "admin_notification" | "appointment_reminder" | "appointment_update";

const defaults: Record<EmailKey, { subject: string; body: string }> = {
  client_confirmation: {
    subject: "Votre demande {{reference}} est bien reçue",
    body: "Bonjour {{name}},\n\nMerci pour votre demande {{reference}}.\nProjet : {{project}}\nEstimation : {{estimate}}\nRendez-vous : {{appointment}}\n\nÀ bientôt,\neazy",
  },
  admin_notification: {
    subject: "Nouvelle demande {{reference}} — {{name}}",
    body: "Nouvelle demande {{reference}}\nClient : {{name}} ({{email}}, {{phone}})\nProjet : {{project}}\nEstimation : {{estimate}}\nRendez-vous : {{appointment}}\n\n{{link}}",
  },
  appointment_reminder: {
    subject: "Rappel : rendez-vous demain ({{appointment}})",
    body: "Bonjour {{name}},\n\nRappel de votre rendez-vous demain : {{appointment}}.\nRéférence : {{reference}}\n\neazy",
  },
  appointment_update: {
    subject: "Votre rendez-vous a été mis à jour ({{reference}})",
    body: "Bonjour {{name}},\n\nVotre rendez-vous est maintenant : {{appointment}} — statut : {{status}}.\nRéférence : {{reference}}\n\neazy",
  },
};

const fill = (s: string, vars: Record<string, string>) => s.replace(/{{(\w+)}}/g, (_, k) => vars[k] ?? "");
const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!);

/** Sends via Resend when RESEND_API_KEY is set; otherwise logs (so local dev works without email). */
export async function sendTemplated(key: EmailKey, to: string, vars: Record<string, string>) {
  let tpl = defaults[key];
  try {
    const { data } = await createAdminClient().from("site_settings").select("value").eq("key", "private_email_templates").maybeSingle();
    const custom = (data?.value as Record<string, { subject?: string; body?: string }> | undefined)?.[key];
    if (custom?.subject || custom?.body) tpl = { subject: custom.subject || tpl.subject, body: custom.body || tpl.body };
  } catch { /* use defaults */ }

  const subject = fill(tpl.subject, vars);
  const text = fill(tpl.body, vars);
  if (!process.env.RESEND_API_KEY) {
    console.log(`[email:dev] to=${to} subject=${subject}\n${text}`);
    return { ok: true, dev: true };
  }
  try {
    const res = await new Resend(process.env.RESEND_API_KEY).emails.send({
      from: process.env.EMAIL_FROM || "eazy <onboarding@resend.dev>",
      to, subject, text,
      html: `<div style="font-family:Arial,sans-serif;line-height:1.6;white-space:pre-line">${esc(text)}</div>`,
    });
    return { ok: !res.error };
  } catch (e) {
    console.error("email failed", e);
    return { ok: false };
  }
}

export const apptLabel = (date?: string, start?: string, end?: string) => (date ? `${date} ${start?.slice(0, 5) ?? ""}${end ? "–" + end.slice(0, 5) : ""}` : "—");
export { defaults as defaultEmailTemplates };

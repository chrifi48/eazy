import { NextResponse } from "next/server";
import { z } from "zod";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/backend/admin";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(40).optional().default(""),
  message: z.string().trim().min(5).max(5000),
  website: z.string().optional(), // honeypot
});

export async function POST(req: Request) {
  if (!(await rateLimit(`contact:${clientIp(req)}`, 5, 10 * 60_000))) return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const { website, ...m } = parsed.data;
  if (website) return NextResponse.json({ ok: true });

  const { error } = await createAdminClient().from("contact_messages").insert(m);
  if (error) return NextResponse.json({ error: "server" }, { status: 500 });

  const to = process.env.ADMIN_NOTIFY_EMAIL || process.env.ADMIN_EMAIL;
  if (process.env.RESEND_API_KEY && to) {
    await new Resend(process.env.RESEND_API_KEY).emails.send({
      from: process.env.EMAIL_FROM || "eazy <onboarding@resend.dev>", to, replyTo: m.email,
      subject: `Contact: ${m.name}`, text: `${m.name} <${m.email}> ${m.phone}\n\n${m.message}`,
    }).catch(() => null);
  }
  return NextResponse.json({ ok: true });
}

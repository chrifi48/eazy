import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/backend/admin";
import { getAvailableSlots } from "@/lib/slots";
import { estimate } from "@/lib/pricing";
import { apptLabel, sendTemplated } from "@/lib/email";
import { clientIp, rateLimit, verifyTurnstile } from "@/lib/rate-limit";
import { formatRange } from "@/lib/format";

export const dynamic = "force-dynamic";

const schema = z.object({
  project_type_id: z.string().uuid().nullable().optional(),
  category_id: z.string().uuid().nullable().optional(),
  template_id: z.string().uuid().nullable().optional(),
  custom_design: z.boolean().default(false),
  package_id: z.string().uuid().nullable().optional(),
  feature_ids: z.array(z.string().uuid()).max(100).default([]),
  client: z.object({
    client_name: z.string().trim().min(2).max(120),
    business_name: z.string().trim().max(160).optional().default(""),
    sector: z.string().trim().max(120).optional().default(""),
    city: z.string().trim().max(80).optional().default(""),
    country: z.string().trim().max(80).optional().default(""),
    email: z.string().trim().email().max(200),
    phone: z.string().trim().max(40).optional().default(""),
    whatsapp: z.string().trim().max(40).optional().default(""),
    language: z.enum(["fr", "ar", "en"]).default("fr"),
    description: z.string().trim().max(5000).optional().default(""),
    deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")),
    budget_range: z.string().max(80).optional().default(""),
  }),
  appointment: z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    start: z.string().regex(/^\d{2}:\d{2}$/),
    meeting_type: z.enum(["in_person", "video", "phone"]),
  }),
  files: z.array(z.object({ path: z.string().max(300).startsWith("incoming/"), name: z.string().max(200) })).max(5).default([]),
  accept_terms: z.literal(true),
  website: z.string().optional(), // honeypot
  turnstile: z.string().optional(),
});

export async function POST(req: Request) {
  const ip = clientIp(req);
  if (!(await rateLimit(`req:${ip}`, 5, 10 * 60_000))) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid", issues: parsed.error.issues.map((i) => i.path.join(".")) }, { status: 400 });
  const b = parsed.data;

  if (b.website) return NextResponse.json({ reference: "PRJ-0000-0000" }); // bot: pretend success
  if (!(await verifyTurnstile(b.turnstile, ip))) return NextResponse.json({ error: "captcha" }, { status: 400 });

  const sb = createAdminClient();

  // Prices are recomputed here from the database; client-sent numbers are never trusted.
  const [{ data: template }, { data: features }, { data: pkg }] = await Promise.all([
    b.template_id ? sb.from("templates").select("price_min,price_max,delivery_days,name_fr").eq("id", b.template_id).maybeSingle() : Promise.resolve({ data: null }),
    b.feature_ids.length ? sb.from("features").select("id,price_min,price_max,extra_days").in("id", b.feature_ids).eq("is_active", true) : Promise.resolve({ data: [] }),
    b.package_id ? sb.from("packages").select("name_fr").eq("id", b.package_id).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  const est = estimate({ template, features: features ?? [] });

  // Re-check the slot is still free (the unique index is the final guard against races)
  const day = (await getAvailableSlots(b.appointment.date, b.appointment.date))[b.appointment.date] ?? [];
  const slot = day.find((s) => s.start === b.appointment.start);
  if (!slot) return NextResponse.json({ error: "slot_taken" }, { status: 409 });

  const c = b.client;
  const { data: request, error } = await sb.from("project_requests").insert({
    project_type_id: b.project_type_id ?? null, category_id: b.category_id ?? null, template_id: b.custom_design ? null : b.template_id ?? null,
    custom_design: b.custom_design, package_id: b.package_id ?? null,
    ...c, deadline: c.deadline || null,
    estimated_min: est.min, estimated_max: est.max, estimated_days: est.days,
  }).select("id,reference").single();
  if (error || !request) return NextResponse.json({ error: "server" }, { status: 500 });

  const { error: apptErr } = await sb.from("appointments").insert({
    request_id: request.id, date: b.appointment.date, start_time: slot.start, end_time: slot.end, meeting_type: b.appointment.meeting_type,
  });
  if (apptErr) {
    await sb.from("project_requests").delete().eq("id", request.id);
    return NextResponse.json({ error: apptErr.code === "23505" ? "slot_taken" : "server" }, { status: apptErr.code === "23505" ? 409 : 500 });
  }

  if (features?.length) await sb.from("request_features").insert(features.map((f) => ({ request_id: request.id, feature_id: f.id, price_min: f.price_min, price_max: f.price_max })));
  if (b.files.length) await sb.from("request_files").insert(b.files.map((f) => ({ request_id: request.id, file_url: f.path, file_name: f.name })));

  const vars = {
    reference: request.reference, name: c.client_name, email: c.email, phone: c.phone || "—",
    project: b.custom_design ? "Design sur mesure" : template?.name_fr ?? pkg?.name_fr ?? "—",
    estimate: formatRange(est.min, est.max, c.language),
    appointment: apptLabel(b.appointment.date, slot.start, slot.end),
    link: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/admin/requests/${request.id}`,
  };
  // Emails are best-effort: a failed email must not fail a saved request
  await Promise.allSettled([
    sendTemplated("client_confirmation", c.email, vars),
    sendTemplated("admin_notification", process.env.ADMIN_NOTIFY_EMAIL || process.env.ADMIN_EMAIL || "", vars),
  ]);

  return NextResponse.json({ reference: request.reference });
}

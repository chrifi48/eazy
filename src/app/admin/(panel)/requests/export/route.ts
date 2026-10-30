/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/backend/server";
import { applyRequestFilters, REQUEST_SELECT, type ReqSearch } from "@/lib/request-query";

export const dynamic = "force-dynamic";

const cell = (v: unknown) => {
  let s = String(v ?? "");
  if (/^[=+\-@]/.test(s)) s = "'" + s; // neutralise spreadsheet formula injection from client-typed text
  return `"${s.replace(/"/g, '""')}"`;
};

export async function GET(req: Request) {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });
  const { data: p } = await sb.from("profiles").select("role").eq("id", user.id).single();
  if (p?.role !== "admin") return new NextResponse("Forbidden", { status: 403 });

  const sp = Object.fromEntries(new URL(req.url).searchParams) as ReqSearch;
  const { data } = await applyRequestFilters(sb.from("project_requests").select(REQUEST_SELECT), sp).limit(10000);
  const head = ["Reference", "Status", "Created", "Client", "Business", "Email", "Phone", "WhatsApp", "City", "Country", "Type", "Category", "Model", "Estimate min", "Estimate max", "Days", "Final price", "Deposit", "Deposit paid", "Final paid", "Appointment"];
  const lines = [head.map(cell).join(",")];
  for (const r of (data ?? []) as any[]) {
    const a = r.appointments?.[0];
    lines.push([r.reference, r.status, r.created_at.slice(0, 10), r.client_name, r.business_name, r.email, r.phone, r.whatsapp, r.city, r.country, r.project_types?.name_fr, r.categories?.name_fr,
      r.custom_design ? "Custom" : r.templates?.name_fr, r.estimated_min, r.estimated_max, r.estimated_days, r.final_price, r.deposit_amount, r.deposit_paid ? "yes" : "no", r.final_paid ? "yes" : "no",
      a ? `${a.date} ${a.start_time.slice(0, 5)}` : ""].map(cell).join(","));
  }
  // BOM so Excel opens UTF-8 (accents, Arabic) correctly
  return new NextResponse("﻿" + lines.join("\r\n"), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="requests-${new Date().toISOString().slice(0, 10)}.csv"` } });
}

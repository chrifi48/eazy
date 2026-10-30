import { NextResponse } from "next/server";
import { getAvailableSlots } from "@/lib/slots";

export const dynamic = "force-dynamic";

const iso = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";
  if (!iso.test(from) || !iso.test(to)) return NextResponse.json({ error: "bad range" }, { status: 400 });
  // cap the window so the endpoint can't be used to scan years of data
  if ((new Date(to).getTime() - new Date(from).getTime()) / 864e5 > 62) return NextResponse.json({ error: "range too large" }, { status: 400 });
  try {
    return NextResponse.json({ slots: await getAvailableSlots(from, to) }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ slots: {} });
  }
}

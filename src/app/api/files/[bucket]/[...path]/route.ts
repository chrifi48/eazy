import { NextResponse } from "next/server";
import { currentUser } from "@/lib/backend/auth";
import { getDb } from "@/lib/backend/pg";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { bucket: string; path: string[] } }) {
  const { bucket } = params;
  if (!["media", "request-files"].includes(bucket)) return new NextResponse("Not found", { status: 404 });

  // client uploads are private: admin only
  if (bucket === "request-files" && (await currentUser())?.role !== "admin") return new NextResponse("Forbidden", { status: 403 });

  const rel = params.path.map(decodeURIComponent).join("/");
  const { db } = await getDb();
  const { rows } = await db.query("select content_type, data from files where bucket = $1 and path = $2", [bucket, rel]);
  if (!rows.length) return new NextResponse("Not found", { status: 404 });

  const headers: Record<string, string> = {
    "Content-Type": rows[0].content_type,
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": bucket === "media" ? "public, max-age=31536000, immutable" : "private, no-store",
  };
  if (bucket === "request-files") headers["Content-Disposition"] = `attachment; filename="${rel.split("/").pop()!.replace(/"/g, "")}"`;
  return new NextResponse(new Uint8Array(rows[0].data), { headers });
}

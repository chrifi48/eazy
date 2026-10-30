import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { currentUser } from "@/lib/backend/auth";
import { getDb } from "@/lib/backend/pg";
import { MAX_UPLOAD_BYTES, MIME } from "@/lib/limits";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const IMAGES = new Set(["png", "jpg", "jpeg", "webp", "gif", "avif", "ico"]);
const DOCS = new Set([...IMAGES, "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "zip"]);

/**
 * bucket "media"         — admin only, images only (templates, logo, portfolio…), publicly readable
 * bucket "request-files" — anyone filling the project form (rate-limited), readable by the admin only
 * Files are stored in the database (table `files`), so no persistent disk is required.
 */
export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  const bucket = String(form?.get("bucket") ?? "");
  if (!(file instanceof File) || !["media", "request-files"].includes(bucket)) return NextResponse.json({ error: "bad request" }, { status: 400 });

  const isMedia = bucket === "media";
  if (isMedia) {
    const me = await currentUser();
    if (me?.role !== "admin") return NextResponse.json({ error: "forbidden" }, { status: 403 });
  } else if (!(await rateLimit(`upload:${clientIp(req)}`, 20, 10 * 60_000))) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const ext = (file.name.split(".").pop() ?? "").toLowerCase();
  if (!(isMedia ? IMAGES : DOCS).has(ext)) return NextResponse.json({ error: "file type not allowed" }, { status: 415 });
  if (file.size > MAX_UPLOAD_BYTES) return NextResponse.json({ error: "file too large" }, { status: 413 });

  const safeName = file.name.replace(/[^\w.-]+/g, "_").slice(-80);
  const folder = isMedia ? String(form?.get("folder") ?? "misc").replace(/[^\w-]/g, "") || "misc" : "incoming";
  const rel = `${folder}/${randomUUID()}-${safeName}`;
  const buf = Buffer.from(await file.arrayBuffer());

  const { db } = await getDb();
  await db.query("insert into files (bucket, path, content_type, size, data) values ($1, $2, $3, $4, $5)", [bucket, rel, MIME[ext] ?? "application/octet-stream", buf.length, buf]);

  return NextResponse.json({ path: rel, url: `/api/files/${bucket}/${rel}` });
}

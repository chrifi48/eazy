import "server-only";
import { getDb, usingExternalDb } from "@/lib/backend/pg";

// Local / single server: in-memory sliding window.
const hits = new Map<string, number[]>();
function memory(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) { hits.set(key, recent); return false; }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) for (const [k, v] of hits) if (!v.some((t) => now - t < windowMs)) hits.delete(k);
  return true;
}

/**
 * true = allowed, false = blocked. With a hosted database the counters live in the `rate_limits` table so every
 * serverless instance shares them; otherwise they are in memory. If the check itself fails we allow the request
 * (availability over strictness) — pair public forms with the honeypot / Turnstile.
 */
export async function rateLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
  if (!usingExternalDb()) return memory(key, limit, windowMs);
  try {
    const { db } = await getDb();
    const secs = windowMs / 1000;
    const { rows } = await db.query("select count(*)::int as c from rate_limits where key = $1 and at > now() - make_interval(secs => $2::float8)", [key, secs]);
    if (rows[0].c >= limit) return false;
    await db.query("insert into rate_limits (key) values ($1)", [key]);
    if (Math.random() < 0.02) await db.query("delete from rate_limits where at < now() - interval '1 day'"); // housekeeping
    return true;
  } catch {
    return true;
  }
}

export const clientIp = (req: Request) =>
  req.headers.get("x-nf-client-connection-ip") || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

export async function verifyTurnstile(token?: string, ip?: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true; // not configured -> honeypot + rate limit only
  if (!token) return false;
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: new URLSearchParams({ secret, response: token, ...(ip ? { remoteip: ip } : {}) }),
  });
  return Boolean((await res.json()).success);
}

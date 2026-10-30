import "server-only";
import fs from "node:fs";
import path from "node:path";
import { hashPassword } from "./password";

/* eslint-disable @typescript-eslint/no-explicit-any */
export type FK = { child: string; childCol: string; parent: string; parentCol: string };
export type Meta = { fks: FK[]; cols: Record<string, Record<string, { type: string; udt: string }>> };
export type Db = { query: (sql: string, params?: any[]) => Promise<{ rows: any[] }>; exec: (sql: string) => Promise<unknown> };
type Ready = { db: Db; meta: Meta };

const g = globalThis as unknown as { __eazyDb?: Promise<Ready> };

/** True when a hosted PostgreSQL is configured (DATABASE_URL), false for the built-in local database. */
export const usingExternalDb = () => Boolean(process.env.DATABASE_URL);

export const dataDir = () => path.resolve(process.env.DATA_DIR || path.join(process.cwd(), "data"));

/**
 * DATABASE_URL set  -> hosted PostgreSQL (Neon, etc.). Tables are created once with `npm run db:setup`.
 * DATABASE_URL unset -> embedded PostgreSQL (PGlite) in ./data/db, created and seeded automatically.
 */
export function getDb(): Promise<Ready> {
  if (!g.__eazyDb) g.__eazyDb = init().catch((e) => { g.__eazyDb = undefined; throw e; });
  return g.__eazyDb;
}

async function open(): Promise<Db> {
  if (usingExternalDb()) {
    const { Pool } = await import("pg");
    // small pool: each serverless instance only needs a few connections (use the pooled/"-pooler" URL on Neon)
    const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: Number(process.env.DB_POOL_MAX ?? 3), idleTimeoutMillis: 10_000, connectionTimeoutMillis: 15_000 });
    return { query: (sql, params) => pool.query(sql, params), exec: (sql) => pool.query(sql) };
  }
  const { PGlite } = await import("@electric-sql/pglite");
  fs.mkdirSync(dataDir(), { recursive: true });
  const pg = new PGlite(path.join(dataDir(), "db"));
  await pg.waitReady;
  return { query: (sql, params) => pg.query(sql, params) as Promise<{ rows: any[] }>, exec: (sql) => pg.exec(sql) };
}

async function init(): Promise<Ready> {
  const db = await open();
  const { rows } = await db.query("select to_regclass('public.project_types') as t");

  if (!usingExternalDb()) {
    if (!rows[0].t) {
      await db.exec(fs.readFileSync(path.join(process.cwd(), "db", "schema.sql"), "utf8"));
      await db.exec(fs.readFileSync(path.join(process.cwd(), "db", "seed.sql"), "utf8"));
    }
    await runMigrations(db);
    await ensureAdmin(db);
  } else if (!rows[0].t) {
    throw new Error("The database is empty. Run `npm run db:setup` once (see DEPLOY.md).");
  }

  const fkRes = await db.query(`
    select tc.table_name as child, kcu.column_name as child_col, ccu.table_name as parent, ccu.column_name as parent_col
    from information_schema.table_constraints tc
    join information_schema.key_column_usage kcu on kcu.constraint_name = tc.constraint_name and kcu.table_schema = tc.table_schema
    join information_schema.constraint_column_usage ccu on ccu.constraint_name = tc.constraint_name and ccu.table_schema = tc.table_schema
    where tc.constraint_type = 'FOREIGN KEY' and tc.table_schema = 'public'`);
  const colRes = await db.query("select table_name, column_name, data_type, udt_name from information_schema.columns where table_schema = 'public'");

  const cols: Meta["cols"] = {};
  for (const c of colRes.rows) (cols[c.table_name] ??= {})[c.column_name] = { type: c.data_type, udt: c.udt_name };
  return { db, meta: { fks: fkRes.rows.map((r) => ({ child: r.child, childCol: r.child_col, parent: r.parent, parentCol: r.parent_col })), cols } };
}

/** Applies db/migrations/*.sql once each, in filename order (tracked in the _migrations table). */
async function runMigrations(db: Db) {
  await db.exec("create table if not exists _migrations (name text primary key, applied_at timestamptz not null default now())");
  const dir = path.join(process.cwd(), "db", "migrations");
  if (!fs.existsSync(dir)) return;
  const done = new Set((await db.query("select name from _migrations")).rows.map((r) => r.name));
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".sql")).sort()) {
    if (done.has(f)) continue;
    await db.exec(fs.readFileSync(path.join(dir, f), "utf8"));
    await db.query("insert into _migrations (name) values ($1)", [f]);
  }
}

/** Creates the single admin from ADMIN_EMAIL / ADMIN_PASSWORD the first time (changeable later in Admin → Account). */
async function ensureAdmin(db: Db) {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) return;
  const { rows } = await db.query("select 1 from profiles where role = 'admin' limit 1");
  if (rows.length) return;
  await db.query("insert into profiles (email, role, password_hash) values ($1, 'admin', $2)", [email, hashPassword(password)]);
}

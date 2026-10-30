// One-time (and after each update) setup of a hosted PostgreSQL such as Neon:
//   npm run db:setup
// Needs DATABASE_URL (and ADMIN_EMAIL / ADMIN_PASSWORD for the first run) in .env.local.
// Safe to re-run: the schema + demo data are only loaded into an empty database; migrations run once each.
import fs from "node:fs";
import path from "node:path";
import { randomBytes, scryptSync } from "node:crypto";
import pg from "pg";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is missing. Put it in .env.local (see DEPLOY.md).");
  process.exit(1);
}

const root = process.cwd();
const read = (...p) => fs.readFileSync(path.join(root, ...p), "utf8");
const client = new pg.Client({ connectionString: url, connectionTimeoutMillis: 20000 });
await client.connect();

try {
  const { rows } = await client.query("select to_regclass('public.project_types') as t");
  if (!rows[0].t) {
    console.log("• empty database: creating tables…");
    await client.query(read("db", "schema.sql"));
    console.log("• loading demo categories, models, features, packages…");
    await client.query(read("db", "seed.sql"));
  } else {
    console.log("• tables already exist");
  }

  await client.query("create table if not exists _migrations (name text primary key, applied_at timestamptz not null default now())");
  const done = new Set((await client.query("select name from _migrations")).rows.map((r) => r.name));
  const dir = path.join(root, "db", "migrations");
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".sql")).sort()) {
    if (done.has(f)) continue;
    console.log(`• applying migration ${f}`);
    await client.query(fs.readFileSync(path.join(dir, f), "utf8"));
    await client.query("insert into _migrations (name) values ($1)", [f]);
  }

  // first admin (same scrypt format as the app uses)
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const admins = await client.query("select email from profiles where role = 'admin'");
  if (admins.rows.length) {
    console.log(`• admin already exists (${admins.rows[0].email})`);
  } else if (email && password) {
    const salt = randomBytes(16).toString("hex");
    const hash = `scrypt$${salt}$${scryptSync(password, salt, 64).toString("hex")}`;
    await client.query("insert into profiles (email, role, password_hash) values ($1, 'admin', $2)", [email, hash]);
    console.log(`• admin created: ${email}`);
  } else {
    console.log("• no admin yet: set ADMIN_EMAIL and ADMIN_PASSWORD and run this again");
  }
  console.log("Done.");
} finally {
  await client.end();
}

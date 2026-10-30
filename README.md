# eazy

Developer-services site: template gallery, 8-step project configurator with live price, booking, and a private admin dashboard.
Next.js 14 (App Router) · TypeScript · Tailwind · next-intl (FR / AR-RTL / EN) · Resend · Recharts.

**The backend lives inside this app.** Locally it needs no external service: a built-in PostgreSQL stores everything in `./data`. For free online hosting it uses a hosted PostgreSQL (Neon) instead: see **DEPLOY.md**.

## 1. Run it

```bash
npm install
cp .env.example .env.local     # set ADMIN_EMAIL, ADMIN_PASSWORD, AUTH_SECRET
npm run dev
```

- Site: http://localhost:3000  ·  Admin: http://localhost:3000/admin/login
- On first start the app creates the database in `./data/db`, loads `db/schema.sql` and `db/seed.sql` (3 project types, 6 categories, 12 templates, 15 features, 5 packages), applies `db/migrations/*.sql` and creates the admin from `ADMIN_EMAIL` / `ADMIN_PASSWORD`.
- **Sample content** (model images, FAQ, example testimonials and portfolio, starter legal text) comes from `db/migrations/001_sample_content.sql`. Testimonials and portfolio entries are marked "Exemple": replace or delete them in the admin before going live, and have the legal text reviewed. Regenerate the placeholder images with `node scripts/gen-samples.mjs`.
- **Two-factor login**: Admin → Account → Two-factor authentication (authenticator app + 8 one-time recovery codes). If you lose both, stop the server and run `update profiles set totp_enabled=false` on the database, or delete `data/`.
- Change the admin email / password later in **Admin → Account**. (The env password is only used the first time.)
- To start over: stop the server and delete the `data/` folder.
- Generate `AUTH_SECRET`: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

Emails: without `RESEND_API_KEY`, emails are printed in the server console. Set `RESEND_API_KEY`, `EMAIL_FROM` (verified domain) and `ADMIN_NOTIFY_EMAIL` for real delivery.

## 2. How the backend works

| Need | Implementation |
|---|---|
| Database | PostgreSQL. `DATABASE_URL` set → hosted Postgres (Neon…), tables created once with `npm run db:setup`. Not set → built-in PGlite in `data/db`, created automatically. Schema in `db/schema.sql` (triggers: `PRJ-YYYY-####` references, unique booking slots) |
| Queries | `src/lib/backend/query.ts` — small query builder (`from().select().eq()…`, embedded relations) |
| Admin login | `src/lib/backend/auth.ts` — scrypt password hash + signed (JWT) httpOnly cookie, verified in middleware |
| File uploads | `/api/upload` → table `files` in the database (max 4 MB); site images are public, client files are admin-only (`/api/files/…`) |
| Booking | `src/lib/slots.ts` computes free slots; a unique DB index makes double booking impossible |
| Spam | honeypot + per-IP rate limit (+ optional Cloudflare Turnstile) |

Access control is enforced in the server code: every admin page/action goes through the session check, visitors can only call the public booking/contact/upload endpoints.

## 3. Structure

```
db/                   schema.sql + seed.sql
src/app/[locale]      public site (fr default, /ar, /en)
src/app/admin         admin (English UI)
src/app/admin/crud    config-driven CRUD: types, categories, templates, features, packages, portfolio, testimonials, FAQ
src/app/api           slots, requests (booking), contact, upload, files, cron/reminders
src/lib/backend       database, query builder, auth, sessions
messages/*.json       translations
```

## 4. Deploy

**Free, no server:** Netlify + Neon, step by step in **DEPLOY.md**.

**Own server (Docker / VPS):** the notes below.

Needs a **Node host with a persistent disk** (VPS, Railway/Render/Fly with a volume, …) because the database and uploads are files in `DATA_DIR`. Serverless hosts such as Vercel have no persistent disk, so they won't work as-is.

1. `npm run build && npm start` with the env vars from `.env.example` (`AUTH_SECRET` is required in production; set `NEXT_PUBLIC_SITE_URL`).
2. Run **one** instance only (the embedded database is single-process). Back up the `data/` folder regularly.
3. Reminder emails: call `GET /api/cron/reminders` once a day with header `Authorization: Bearer <CRON_SECRET>` (system cron, or your host's scheduler).

## 5. Known limits

- "Export PDF" uses the browser print dialog (Save as PDF).
- The rate limiter is in memory (resets on restart).
- The rich-text editor uses the browser's built-in editing commands (simple formatting only: headings, bold, italic, lists, links).

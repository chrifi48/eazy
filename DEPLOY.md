# Publish eazy for free (Netlify + Neon)

| Part | Service | Cost | Card needed |
|---|---|---|---|
| Website + admin | **Netlify** (free plan, commercial use allowed) | free | no |
| Database + uploaded files | **Neon** PostgreSQL (free plan) | free | no |
| Code storage | **GitHub** | free | no |
| Emails (optional) | **Resend** | free plan | no |
| Daily reminder trigger | **cron-job.org** | free | no |

You get a free address like `https://your-site.netlify.app`. A custom domain (e.g. `eazy.ma`) costs money at a registrar, but is optional.
Free-plan limits change over time: check each provider's pricing page.

> **Not Vercel:** its free "Hobby" plan is for personal, non-commercial use only. Use Netlify for a business site.

## 1. Create the database (Neon)
1. Sign up at https://neon.com (GitHub/Google login), click **Create project**, pick a region close to you (e.g. Frankfurt).
2. On the project dashboard click **Connect** and copy the **connection string** (use the *pooled* one, its host contains `-pooler`). It looks like `postgresql://user:password@ep-xxx-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require`.

## 2. Fill the database (once, from your computer)
In `.env.local` set:
```
DATABASE_URL=postgresql://...        # from Neon
ADMIN_EMAIL=you@yourmail.com
ADMIN_PASSWORD=a-long-unique-password
AUTH_SECRET=<64 random hex chars>    # node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Then run:
```
npm run db:setup
```
It creates the tables, loads the demo models/features/packages/FAQ and creates your admin account. Safe to run again after future updates (it only applies new migrations).

## 3. Put the code on GitHub
Create a (private) repository on https://github.com, then in the project folder:
```
git add -A
git commit -m "eazy"
git branch -M main
git remote add origin https://github.com/YOUR-USER/YOUR-REPO.git
git push -u origin main
```
(`.env.local` and `data/` are git-ignored, so your secrets are not uploaded.)

## 4. Deploy on Netlify
1. Sign up at https://netlify.com with GitHub → **Add new site → Import an existing project** → pick the repository. Build settings are read from `netlify.toml`.
2. **Site configuration → Environment variables**, add:

| Variable | Value |
|---|---|
| `DATABASE_URL` | the Neon connection string |
| `AUTH_SECRET` | the same random value as in `.env.local` |
| `NEXT_PUBLIC_SITE_URL` | your site address, e.g. `https://your-site.netlify.app` |
| `CRON_SECRET` | any random string |
| `RESEND_API_KEY`, `EMAIL_FROM`, `ADMIN_NOTIFY_EMAIL` | for real emails (optional, see below) |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | e.g. `212600000000` |

3. **Deploy**. When it is live open `/admin/login`, sign in, then in **Admin → Account** change the password and turn on two-factor.

## 5. Emails (optional)
Without `RESEND_API_KEY` no email is sent. Create a free account at https://resend.com and add the key.
Until you verify your own domain at Resend you can only send to your own address (use `EMAIL_FROM=onboarding@resend.dev`).

## 6. Reminder emails the day before an appointment
At https://cron-job.org create a free job: URL `https://your-site.netlify.app/api/cron/reminders`, once a day at 09:00,
with the request header `Authorization: Bearer <your CRON_SECRET>`.

## 7. Backups
Neon keeps some history on the free plan, but make your own copy regularly (needs Docker):
```
docker run --rm postgres:16 pg_dump "<DATABASE_URL>" > eazy-backup.sql
```

## What to know about free hosting
- **Uploads are limited to 4 MB** per file (set `NEXT_PUBLIC_MAX_UPLOAD_MB`) and are stored inside the database, which shares the free storage quota with your data. For many/large files move uploads to object storage later.
- Neon puts an idle database to sleep: the first visit after a quiet period can take about a second longer.
- Free plans have monthly bandwidth/compute allowances; check them if the site gets popular.

## Other option: your own server (Docker)
If you prefer a VPS, `docker compose up -d --build` runs the site with its built-in database and automatic HTTPS (see `docker-compose.yml`, `Caddyfile`). Leave `DATABASE_URL` empty and back up the `eazy-data` volume.

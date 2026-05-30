# RAVALI TRADERS — Contractor Rewards Dashboard

Mobile-first contractor recognition app for **RAVALI TRADERS**. Amount-based rewards (₹), Telugu UI, QR login, Supabase backend.

## Prerequisites

- Node.js 20+
- [Supabase](https://supabase.com) project
- [Vercel](https://vercel.com) account (recommended) or any Node host

## 1. Supabase setup

Run these in **Supabase → SQL Editor** (in order):

1. `supabase/migrations/001_schema.sql`
2. `supabase/migrations/002_fix_leaderboard_functions.sql`
3. `supabase/migrations/003_remove_seed_contractors.sql` *(optional — clears sample contractors)*

## 2. Local development

```bash
npm install
cp .env.example .env.local
# Fill in Supabase keys + ADMIN_PIN in .env.local
npm run dev
```

Open [http://localhost:3001](http://localhost:3001)

| Route | Purpose |
|-------|---------|
| `/` | QR scanner for contractors |
| `/dashboard/[token]` | Contractor dashboard |
| `/admin` | Shop owner admin (6-digit PIN) |

## 3. Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server-only service role key |
| `ADMIN_PIN` | Yes (prod) | 6-digit admin login PIN |
| `NEXT_PUBLIC_APP_URL` | Recommended | Production URL for QR codes (custom domain) |

> Never commit `.env.local` or expose `SUPABASE_SERVICE_ROLE_KEY` to the browser.

## 4. Deploy to Vercel

1. Push code to GitHub
2. Import project in [vercel.com/new](https://vercel.com/new)
3. Add all environment variables from `.env.example`
4. Set `ADMIN_PIN` to a strong 6-digit PIN (not `123456`)
5. Deploy

After deploy, set `NEXT_PUBLIC_APP_URL` to your live URL (e.g. `https://ravali-traders.vercel.app`) and redeploy so QR cards use the correct link.

## 5. Production checklist

- [ ] SQL migrations run in Supabase
- [ ] All env vars set in Vercel
- [ ] `ADMIN_PIN` changed from default
- [ ] `NEXT_PUBLIC_APP_URL` set to live domain
- [ ] Add real contractors via `/admin`
- [ ] Download & print QR cards for each contractor
- [ ] Test QR scan on a phone → opens dashboard

## 6. Scripts

```bash
npm run dev      # Local dev (port 3001)
npm run build    # Production build
npm run start    # Run production build locally
npm run lint     # ESLint
```

## Architecture

| Layer | Purpose |
|-------|---------|
| `supabase/migrations/` | Schema, RLS, SQL functions |
| `/api/contractor/[token]` | Contractor dashboard data |
| `/api/admin` | Admin CRUD (PIN header required) |
| Service role key | Server-side only — never in client bundle |

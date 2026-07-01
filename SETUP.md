# Nic Crochet — Local Setup & Supabase Guide

This app uses **Supabase for Postgres + Storage only** (no Supabase Auth). Admin
auth is a single env-configured account with a bcrypt-hashed password.

## 1. Install & run

```bash
npm install
cp .env.example .env   # then fill in values (see below)
npm run dev            # http://localhost:3000  (or -p 3100)
```

Without real credentials the site still renders the **seed catalogue** (static
fallback), so you can develop the UI before the DB exists.

## 2. Create the Supabase project

1. Go to <https://supabase.com/dashboard> → **New project**.
   - Name: `nic-crochet`
   - Region: closest to Brazil (e.g. `South America (São Paulo)`)
   - Set a strong **database password** — save it, you'll need it below.
2. Wait for provisioning (~2 min).

### 2a. Connection strings → `DATABASE_URL` / `DIRECT_URL`

Project → **Settings → Database → Connection string**:

- `DATABASE_URL`: the **Transaction pooler** URI (port `6543`). Append
  `?pgbouncer=true`. Used by the app at runtime.
- `DIRECT_URL`: the **Session/direct** URI (port `5432`). Used by Prisma for
  `db push` / migrations.

Replace `[YOUR-PASSWORD]` in both with the DB password from step 1.

### 2b. API keys → Storage

Project → **Settings → API**:

- `NEXT_PUBLIC_SUPABASE_URL` = Project URL (`https://<ref>.supabase.co`)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `anon` `public` key
- `SUPABASE_SERVICE_ROLE_KEY` = `service_role` key (**server only, secret**)

### 2c. Create the Storage bucket

Project → **Storage → New bucket**:

- Name: `product-photos`
- **Public bucket: ON** (photos are shown publicly on the storefront)
- Keep `SUPABASE_STORAGE_BUCKET=product-photos` in `.env`.

## 3. Push the schema & seed

```bash
npm run db:push     # creates tables from prisma/schema.prisma
npm run db:seed     # loads the 8 prototype products (optional)
```

## 4. Admin credentials

```bash
npm run admin:hash -- "your-real-password"
# paste output into ADMIN_PASSWORD_HASH
```

Also set `ADMIN_USERNAME` and a strong random `AUTH_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

> Dev default (placeholder in `.env`): user `nic`, password `trocar123`.
> **Change before launch.**

## 5. Contact details (placeholders → real)

Swap these in `.env` before launch:

- `NEXT_PUBLIC_WHATSAPP_NUMBER` — international format, digits only
  (e.g. `5511999998888`)
- `NEXT_PUBLIC_INSTAGRAM_HANDLE` — e.g. `nic.crochet`
- `NEXT_PUBLIC_CONTACT_EMAIL`

## 6. Production notes

- `sharp` is required for `next/image` optimization when self-hosting — installed
  automatically as a Next dependency, but confirm on the VPS (see deploy phase in
  `CLAUDE.md`).
- Run `npm run build` (which runs `prisma generate` first) then `npm start`.

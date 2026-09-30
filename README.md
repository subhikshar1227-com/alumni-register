# SVCE Alumni 2026 — Registration + Admin Portal

Two Next.js apps sharing one PostgreSQL database:

- **`/` (this app)** — the public Alumni Registration form. Runs on `:3000`.
- **`alumni-registration-admin-portal/`** — the admin dashboard (login, approve/reject, generate & send membership cards / entry passes). Runs on `:3001`.

Both apps talk to the same Postgres database directly via [Prisma](https://www.prisma.io/). Migrations are owned by this app (`/prisma`); the admin portal has a **copy** of the same `schema.prisma` and only ever runs `prisma generate` against it (never `migrate`).

## Prerequisites

- Node.js 20+ and `pnpm` (`npm i -g pnpm`)
- PostgreSQL 14+ running locally (or reachable via a connection string) — install from [postgresql.org](https://www.postgresql.org/download/) or via your OS package manager
- An SMTP account for sending email (Gmail with an [App Password](https://myaccount.google.com/apppasswords) works well for development)

## 1. Clone and create the database

```bash
git clone https://github.com/Shivani-raj1105/ALUMNI_FORM.git
cd ALUMNI_FORM
```

Create an empty database (name can be anything — just keep it consistent with `DATABASE_URL` below):

```bash
# using psql
psql -U postgres -c "CREATE DATABASE svce_alumni;"
```

## 2. Configure environment variables

Both apps need their own `.env`, copied from the provided `.env.example`:

```bash
cp .env.example .env
cp alumni-registration-admin-portal/.env.example alumni-registration-admin-portal/.env
```

Edit **both** `.env` files:

- `DATABASE_URL` — must be **identical** in both files (same database). Example: `postgresql://postgres:yourpassword@localhost:5432/svce_alumni?schema=public`
- `EMAIL_HOST` / `EMAIL_PORT` / `EMAIL_USER` / `EMAIL_PASSWORD` / `EMAIL_FROM` — your SMTP credentials
- In the admin portal's `.env` only: set `ADMIN_PASSWORD` to something private, and `ADMIN_SESSION_SECRET` to a long random string (e.g. `openssl rand -base64 32`)

Never commit `.env` — it's gitignored in both apps. Only `.env.example` (with placeholder values) is tracked.

## 3. Install dependencies

```bash
pnpm install
cd alumni-registration-admin-portal
pnpm install
cd ..
```

## 4. Set up the database schema

Run this from the **root app only** — it owns the migrations and will create every table (`AlumniRegistration`, `EmailLog`, `AlumniIdCounter`) from the migration already committed in `prisma/migrations/`:

```bash
npx prisma migrate deploy
```

Then generate the Prisma client in **both** apps (this reads `schema.prisma` and generates the typed client used by the code — it does not touch the database):

```bash
npx prisma generate
cd alumni-registration-admin-portal
npx prisma generate
cd ..
```

That's it — no manual table creation in pgAdmin needed. If you ever open pgAdmin, you should now see `AlumniRegistration`, `EmailLog`, and `AlumniIdCounter` under your database's `public` schema.

## 5. Run both apps

In one terminal:

```bash
pnpm dev
```
→ registration form at http://localhost:3000

In a second terminal:

```bash
cd alumni-registration-admin-portal
PORT=3001 pnpm dev
```
→ admin dashboard at http://localhost:3001 (log in with the `ADMIN_PASSWORD` you set)

## Changing the schema later

Edit `prisma/schema.prisma` in the root app, then:

```bash
npx prisma migrate dev --name describe_your_change
```

Copy the updated `schema.prisma` into `alumni-registration-admin-portal/prisma/schema.prisma` and run `npx prisma generate` there too — see the comment at the top of that file for why the two apps don't share one physical schema file.

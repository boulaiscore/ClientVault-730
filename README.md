# ClientVault 730

ClientVault 730 is a Next.js MVP for Italian accounting firms that collect and review documents for 730 practices.

It includes the internal studio workflow, Supabase/Postgres persistence, tokenized public client upload portal, private storage, signed downloads, and repository/domain boundaries.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Postgres / Supabase-compatible schema
- Supabase Storage with private bucket
- Vitest

## Getting Started

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Routes

- `/`
- `/sign-in`
- `/sign-up`
- `/onboarding/organization`
- `/dashboard`
- `/clients`
- `/clients/new`
- `/clients/[id]`
- `/practices`
- `/practices/new`
- `/practices/[id]`
- `/p/[publicToken]`

## Database

The full schema snapshot is in `database/schema.sql`.

Canonical Supabase CLI migrations live in `supabase/migrations`. `supabase db reset` applies these files from a clean local database, including the private `client-documents` storage bucket.

The `database/migrations` folder is kept as an app-schema mirror/reference for readers and non-Supabase Postgres installs. Do not rely on it for Supabase CLI resets.

Local Supabase setup:

```bash
supabase start
supabase db reset
npm run seed:dev
npm run qa:check
npm run test:integration
npm run dev
```

`.env.local` can be copied from `.env.example`. If local Supabase is already running, the dev scripts can also read local URL and keys from `supabase status -o env`.

The app intentionally uses `public.profiles` as the studio user profile table, linked to `auth.users`. There is no separate `public.users` table.

## Private Storage

The private Supabase Storage bucket is created by `supabase/migrations/20260706000004_private_storage_bucket.sql`:

```sql
insert into storage.buckets (id, name, public)
values ('client-documents', 'client-documents', false)
on conflict (id) do update set public = false;
```

Uploads are stored at:

```text
org-{organizationId}/practice-{practiceId}/item-{practiceItemId}/{documentId}-{safeFileName}
```

The bucket must remain private. Studio downloads use signed URLs generated server-side.


## Local End-to-End Setup

```bash
supabase start
supabase db reset
npm install
npm run seed:dev
npm run qa:check
npm run test:integration
npm run dev
```

`npm run seed:dev` prints:

- `organization_id`
- `client_id`
- `practice_id`
- `public_token`
- `studio_practice_url`
- `public_portal_url`

Then open `/dashboard`, the printed studio practice URL, and the printed public portal URL.

## Integration QA

```bash
npm run test:integration
```

The integration suite expects local Supabase to be running and `.env.local` to contain the local Supabase URL and service role key. It covers seed/template creation, public token behavior, storage upload, document records, signed URLs, and tenant-scoped queries.

Manual browser smoke steps are in `docs/QA_SMOKE_TEST.md`.
Security checks are in `docs/SECURITY_CHECKLIST.md`.

## Tests

```bash
npm run qa:check
npm run test:integration
npm run typecheck
npm run build
npm test
```

## Not Implemented

- Email reminders
- Stripe billing
- AI/OCR
- WhatsApp API
- PEC
- E-signature
- Tax calculation
- External integrations

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

The full schema is in `database/schema.sql`.

Migrations:

- `database/migrations/0001_initial_schema.sql`
- `database/migrations/0002_studio_730_workflow.sql`
- `database/migrations/0003_public_portal_uploads.sql`

Local Supabase setup:

```bash
supabase start
supabase db reset
```

Until auth is wired, set `CLIENTVAULT_DEV_ORGANIZATION_ID` to an existing organization id.

## Private Storage

Create a private Supabase Storage bucket matching `CLIENTVAULT_STORAGE_BUCKET`:

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

## Tests

```bash
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

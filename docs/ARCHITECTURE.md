# Architecture

ClientVault 730 is organized around a narrow document collection workflow for 730 practices.

## Layers

- `app/`: Next.js routes and server pages.
- `components/`: UI primitives and studio layout components.
- `lib/domain/`: pure business logic for templates, practice progress, status derivation, upload validation, and filename safety.
- `lib/studio/`: repository interface, persistence implementations, actions, and organization resolution.
- `lib/portal/`: public upload server actions.
- `lib/db/`: Supabase client creation.
- `lib/storage/`: storage provider abstraction and Supabase Storage implementation.
- `types/`: shared domain and database types.

## Repository Boundary

UI pages and server actions use `getStudioRepository()`. They do not import raw database clients.

Implementations:

- `SupabaseStudioRepository`: durable server-side persistence.
- `InMemoryStudioRepository`: tests and explicit local throwaway mode only.

## Tenant Safety

Every repository query that handles tenant data scopes by `organization_id`. Public uploads validate the token, practice, and practice item relationship server-side before storing any document.

## Public Portal

`/p/[publicToken]` requires no account and never exposes internal practice or organization ids in the URL. Invalid or disabled tokens return not found. Archived practices do not accept uploads.

## Storage

Storage is private. Uploads and signed URLs are created server-side with the service role key. No client component imports the service-role Supabase client.

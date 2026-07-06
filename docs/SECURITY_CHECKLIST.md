# Security Checklist

- `SUPABASE_SERVICE_ROLE_KEY` is used only in server-side helpers and scripts.
- Client-facing components do not import `createServiceSupabaseClient`.
- Supabase Storage bucket `client-documents` is private.
- Public URLs use `/p/[publicToken]` and do not expose `organization_id` or internal ids.
- Public tokens are generated from 32 random bytes and are unguessable.
- Uploads validate that `practiceItemId` belongs to the practice resolved from the public token.
- MIME type validation is server-side.
- File size validation is server-side with a 25 MB limit.
- Each checklist item is capped at 10 active files.
- Signed URLs are generated server-side only.
- Disabled public links block public lookup and upload.
- Archived practices block upload.
- The public portal never lists files from the bucket.
- Repository methods scope tenant data by `organization_id`.
- The storage path includes organization, practice, item, and document ids for traceability.

## Email Reminders

- `RESEND_API_KEY` is server-only and must never use a `NEXT_PUBLIC_` prefix.
- Local development should use `EMAIL_PROVIDER=console` unless intentionally testing Resend.
- Reminder emails include only missing/correction item labels and the tokenized portal URL; they must not expose `organization_id`.
- Failed email attempts are recorded in `reminders` without leaking provider secrets into payloads or activity logs.

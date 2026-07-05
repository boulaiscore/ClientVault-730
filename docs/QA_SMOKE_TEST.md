# QA Smoke Test

This is the manual end-to-end check for local Supabase.

## Setup

```bash
supabase start
supabase db reset
npm install
npm run seed:dev
npm run dev
```

Copy the `studio_practice_url` and `public_portal_url` printed by `npm run seed:dev`.

## Public Portal Upload

1. Open `public_portal_url`.
2. Confirm the page headline is `Documenti per il tuo 730`.
3. Confirm checklist categories are visible.
4. Upload a small PDF or PNG to the first requested item.
5. Expected: success message `Documento ricevuto`.

## Studio Review

1. Open `studio_practice_url`.
2. Confirm the uploaded document appears under the matching checklist item.
3. Click `Apri`.
4. Expected: a signed Supabase Storage URL opens/downloads the file.
5. Change item status to `Approvato` and save.
6. Expected: progress increases.

## Link Controls

1. Disable the client link from the studio page.
2. Reload the public portal URL.
3. Expected: not found.
4. Re-enable the link.
5. Expected: public portal loads again.

## Archived Practice

1. Set the practice status to `Archiviata`.
2. Reload the public portal.
3. Expected: the page loads but upload controls are unavailable.

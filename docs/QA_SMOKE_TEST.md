# QA Smoke Test

This is the manual end-to-end check for local Supabase.

## Setup

```bash
supabase start
supabase db reset
npm install
npm run seed:dev
npm run qa:check
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


## Reminder And Correction Loop

1. Upload a document from the public portal.
2. Open `studio_practice_url`.
3. Change the uploaded item status to `Da correggere`, add a clear note such as `Documento illeggibile`, and save.
4. Reload the public portal.
5. Expected: the item shows a correction note and the CTA says `Carica documento corretto`.
6. Back in studio, click `Notifica correzione`.
7. Expected: with `EMAIL_PROVIDER=console`, the correction email is printed in the server logs and a reminder record/activity log is created.
8. Click practice-level `Invia reminder`.
9. Expected: the reminder email includes requested and correction items, but excludes approved, not needed, and uploaded-only items.
10. Run `npm run reminders:send-due` after setting the seeded practice status to `sent`, `in_progress`, or `needs_review` if you want to test the manual due-reminder job.

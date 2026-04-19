# Batch 32 - Admin Save Timeout Guard

## What changed
- Increased generic `requestSafetyApi()` write timeout from `12s` to `30s` for admin save paths other than upload/report upsert.
- Added timeout-aware save guidance for write aborts so the error explains that server-side persistence may still be in progress.
- Wrapped admin headquarter/site/user save submits in local `try/catch` so timeout failures do not close the modal or surface as an unhandled async error.

## Why
- Controller save flows were still surfacing raw timeout failures during headquarter/site/user edits.
- The global admin banner already captured the message, but the modal could remain in an awkward state and the user had no immediate next-step guidance.

## Proof
- `npx tsx --test lib/safetyApi/client.test.ts`
- `npx tsc --noEmit --pretty false`
- `npm run test:client:smoke -- admin-headquarters admin-sites admin-users`

## Notes
- This is graceful failure handling, not optimistic success.
- On timeout, the modal stays open and the user is told to refresh first and check whether the save actually landed before retrying.

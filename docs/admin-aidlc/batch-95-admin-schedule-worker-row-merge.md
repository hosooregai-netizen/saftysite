# Batch 95: Admin Schedule Worker Row Merge

## Scope

- `server/admin/scheduleSnapshot.ts`
- `server/admin/scheduleSnapshot.test.ts`
- `server/admin/workerScheduleMirror.ts`
- `server/admin/workerScheduleMirror.test.ts`
- `app/api/me/schedules/route.ts`
- `app/api/me/schedules/[scheduleId]/route.ts`
- `app/api/me/schedules/next/route.ts`
- `tests/client/admin/admin-schedule-cross-account-refresh.proof.md`

## Change

- Admin schedule responses merge request-month backend calendar/queue rows with memo-backed schedule rows.
- Worker-entered `/me/schedules` updates are included in the admin schedule calendar and queue read model.
- Memo-backed admin repairs remain preferred when they are newer, while backend rows fill missing worker-entered dates and report links.
- Backend rows can match memo-backed rows by schedule id or by the same site/round pair, so worker rows with backend ids still replace the generated empty round row.
- Worker schedule writes also mirror the saved round into the site memo schedule envelope so admin snapshots can see the row even if the backend admin schedule list lags behind worker `/me/schedules`.
- Worker schedule reads backfill existing selected rows into the same site memo envelope, so already-saved worker rows become visible to admin after the worker schedule page is opened.
- Worker schedule reads/writes also populate an in-process mirror store that admin calendar/queue snapshot responses merge, so worker rows stay visible even when the worker token cannot update the admin-only site memo endpoint.

## Validation

- `npx tsx --test server/admin/scheduleSnapshot.test.ts`
- `npx tsx --test server/admin/workerScheduleMirror.test.ts server/admin/scheduleSnapshot.test.ts`
- `npx tsc --noEmit --pretty false`
- `npm run test:client:smoke -- admin-schedules`

# Batch 95: Admin Schedule Worker Row Merge

## Scope

- `server/admin/scheduleSnapshot.ts`
- `server/admin/scheduleSnapshot.test.ts`
- `tests/client/admin/admin-schedule-cross-account-refresh.proof.md`

## Change

- Admin schedule responses merge request-month backend calendar/queue rows with memo-backed schedule rows.
- Worker-entered `/me/schedules` updates are included in the admin schedule calendar and queue read model.
- Memo-backed admin repairs remain preferred when they are newer, while backend rows fill missing worker-entered dates and report links.
- Backend rows can match memo-backed rows by schedule id or by the same site/round pair, so worker rows with backend ids still replace the generated empty round row.

## Validation

- `npx tsx --test server/admin/scheduleSnapshot.test.ts`
- `npx tsc --noEmit --pretty false`
- `npm run test:client:smoke -- admin-schedules`

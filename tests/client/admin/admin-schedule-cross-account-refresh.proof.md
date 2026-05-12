# Admin Schedule Cross Account Refresh Proof

## Scenario

Worker account saves or changes a schedule date while the admin schedule calendar is already open in another account.

## Expected

- admin schedule calendar and queue continue to render cached data immediately
- the same request revalidates in the background instead of returning early from fresh session cache
- returning focus to the admin tab, making it visible, or waiting up to 30 seconds triggers another refresh

## Evidence

- `features/admin/sections/schedules/SchedulesSection.tsx` removes the fresh-cache early return for schedule calendar/queue payloads
- the schedule section now increments `refreshNonce` on focus, visibility, and a 30-second interval, causing the schedule fetch effect to run again
- the admin schedule response now merges request-month backend calendar/queue rows into memo-backed rows so worker-entered `/me/schedules` changes are visible in the admin schedule tab
- backend rows are matched by schedule id or the same site/round pair, covering worker rows whose backend id differs from the generated admin round id
- worker schedule PATCH/POST mirrors the saved schedule round into the site memo schedule envelope, so admin snapshots still see worker-entered rows when the backend admin schedule list lags
- worker schedule GET also backfills already-selected worker rows into the site memo schedule envelope, allowing existing saved rows to recover when the worker schedule page is opened
- worker schedule GET/PATCH/POST additionally writes the row to an in-process mirror store that admin calendar/queue responses merge, covering environments where a worker token cannot patch admin site memo
- validation command: `npx eslint features/admin/sections/schedules/SchedulesSection.tsx`
- validation command: `npx tsx --test server/admin/scheduleSnapshot.test.ts`
- validation command: `npx tsx --test server/admin/workerScheduleMirror.test.ts server/admin/scheduleSnapshot.test.ts`

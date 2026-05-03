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
- the admin schedule snapshot now merges backend schedule rows into memo-backed rows so worker-entered `/me/schedules` changes are visible in the admin schedule tab
- validation command: `npx eslint features/admin/sections/schedules/SchedulesSection.tsx`
- validation command: `npx tsx --test server/admin/scheduleSnapshot.test.ts`

# Worker Calendar Linking Proof

## Covered Change

- `features/calendar/components/WorkerCalendarScreen.tsx`

## Expected Result

- when a worker creates or reuses a draft session from the calendar, the schedule keeps the linked report key
- reopening the same round should resolve back to the same draft more reliably
- blank duplicate reservations on the same site/date are hidden from the calendar and cleared from the worker schedule row when a report-backed row already owns that date
- initial report-index loading is scoped to the selected site or current schedule-row sites instead of preloading every assigned site
- the visit dialog fetches the selected site's contract window only, avoiding all-site contract detail fan-out

## Validation Notes

- `npx eslint features/calendar/components/workerCalendarReportMatching.ts features/calendar/components/WorkerCalendarScreen.tsx features/mobile/components/MobileWorkerCalendarScreen.tsx features/calendar/components/workerCalendarReportMatching.test.ts`
  - passes
- `npx eslint features/calendar/components/WorkerCalendarScreen.tsx features/calendar/components/workerCalendarLoading.ts features/calendar/components/workerCalendarLoading.test.ts`
  - passes
- `npx tsc --noEmit --pretty false`
  - passes
- `npm run test:client:smoke -- worker-calendar`
  - passes with `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3100`
- `npx tsx --test features/calendar/components/workerCalendarReportMatching.test.ts`
  - passes
- `npx tsx --test features/calendar/components/workerCalendarLoading.test.ts features/calendar/components/workerCalendarReportMatching.test.ts`
  - passes

## Manual Review

- verified existing sessions now return `linkedReportKey: existingSession.id`
- verified newly created sessions now return `linkedReportKey: createdSession.id`
- verified schedule save flow persists the schedule/report link after session creation

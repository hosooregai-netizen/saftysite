# Worker Calendar Linking Proof

## Covered Change

- `features/calendar/components/WorkerCalendarScreen.tsx`

## Expected Result

- when a worker creates or reuses a draft session from the calendar, the schedule keeps the linked report key
- reopening the same round should resolve back to the same draft more reliably

## Validation Notes

- `npx eslint features/calendar/components/WorkerCalendarScreen.tsx`
  - passes
- `npx tsc --noEmit --pretty false`
  - passes
- `npm run test:client:smoke -- worker-calendar`
  - blocked locally because `http://127.0.0.1:3100` was not running

## Manual Review

- verified existing sessions now return `linkedReportKey: existingSession.id`
- verified newly created sessions now return `linkedReportKey: createdSession.id`
- verified schedule save flow persists the schedule/report link after session creation

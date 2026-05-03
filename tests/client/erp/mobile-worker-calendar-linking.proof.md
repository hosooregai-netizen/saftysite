# Mobile Worker Calendar Linking Proof

## Scope

- `features/mobile/components/MobileWorkerCalendarScreen.tsx`
- `features/mobile/components/MobileShell.tsx`

## Contract

- mobile worker calendar keeps the same contract-window date guard as desktop
- tapping an existing saved schedule card opens that schedule for edit instead of picking an arbitrary default row
- saving a mobile worker schedule creates or reuses the matching technical-guidance draft and writes the linked report key back to the schedule
- mobile shell can surface the logged-in account name in the header without changing navigation contracts
- report-backed schedules suppress and clear blank duplicate reservations on the same site/date so an accidentally reserved later round does not remain visible

## Validation

- `npx eslint features/calendar/components/workerCalendarReportMatching.ts features/calendar/components/WorkerCalendarScreen.tsx features/mobile/components/MobileWorkerCalendarScreen.tsx features/calendar/components/workerCalendarReportMatching.test.ts`
- `npx tsc --noEmit --pretty false`
- `npx tsx --test features/calendar/components/workerCalendarReportMatching.test.ts`
- `npm run test:client:smoke -- worker-calendar`

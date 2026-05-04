# Admin AIDLC Batch 96: Worker Schedule State Colors

## Scope

- `features/admin/sections/schedules/SchedulesSection.tsx`
- `lib/calendar/scheduleDisplayPhase.ts`
- `features/calendar/components/WorkerCalendarScreen.tsx`
- `features/mobile/components/MobileWorkerCalendarScreen.tsx`
- `features/calendar/components/workerCalendarReportMatching.ts`
- `tests/client/admin/admin-schedule-phase-alignment.proof.md`
- `tests/client/erp/worker-schedule-report-sync.proof.md`

## Change

- Shared the schedule display-phase helper between admin and worker calendar surfaces.
- Worker desktop and mobile calendar chips now use the same phase tones as the admin schedule calendar.
- Draft-only report fallback rows keep `actualVisitDate` empty so draft report links render as in-progress instead of completed.
- Worker schedule save now saves only the schedule; technical guidance draft creation/linking stays behind the desktop `기술지도 실시` action.

## Validation

- `node --import tsx --test lib/calendar/scheduleDisplayPhase.test.ts features/calendar/components/workerCalendarReportMatching.test.ts features/schedule-report-sync/scheduleReportSync.test.ts`
- `npx tsc --noEmit --pretty false`
- `npm run lint -w @saftysite/web`
- `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3100 npm run test:client:smoke -- worker-calendar mobile-worker-nav`

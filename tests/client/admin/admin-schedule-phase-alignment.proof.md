# Admin Schedule Phase Alignment Proof

## Covered Change

- `features/admin/sections/schedules/SchedulesSection.tsx`
- `lib/calendar/scheduleDisplayPhase.ts`
- `features/calendar/components/WorkerCalendarScreen.module.css`

## Expected Result

- admin calendar chips use legacy-style phase tones.
- worker desktop/mobile calendar chips use the same phase meanings as admin schedule chips.
- `completed` rows render as completed phase.
- linked report rows without a completion visit date render as `기술지도 진행중`.
- legacy submitted/completed rows are normalized to `완료`.
- plain planned rows render as `예정`.
- overdue warning emphasis only overrides true planned rows.
- draft-only report fallback rows do not populate `actualVisitDate`, so they do not render as completed.

## Validation Notes

- `node --import tsx --test lib/calendar/scheduleDisplayPhase.test.ts features/calendar/components/workerCalendarReportMatching.test.ts features/schedule-report-sync/scheduleReportSync.test.ts`
- `npx tsc --noEmit --pretty false`
- `npm run lint -w @saftysite/web`
- `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3100 npm run test:client:smoke -- worker-calendar mobile-worker-nav`

## Manual Review

- Verified the shared schedule display-phase helper keeps linked rows without visit completion as `기술지도 진행중`.
- Verified the legacy schedule alignment helper upgrades submitted legacy rows to `완료`.
- Verified worker calendar chip tone classes now distinguish completed / in-progress / planned rows.

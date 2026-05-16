# Technical Guidance Previous Round Accident Seed Proof

## Covered Contract

- New technical guidance sessions can receive previous-round accident seed values as initial Doc2 state.
- The frontend accepts a missing or null `previous_round_accident` seed without changing the default `accidentOccurred: "no"`.
- Site report list creation and worker calendar launch both pass the seed-derived Doc2 initial values into the shared session creation path.
- New report creation flushes pending session edits before requesting the seed, so the previous round's latest accident state can be seen by the backend.
- Report deletion waits for the archive request to finish before closing the confirmation flow, reducing delete/recreate races.

## Verification

- `npx tsx --test lib/safetyApiMappers/reportsPayload.test.ts`
- `npx eslint features/site-reports/hooks/useSiteReportListState.ts features/calendar/components/WorkerCalendarScreen.tsx features/site-reports/components/SiteReportListPanel.tsx features/site-reports/report-list/SiteReportDeleteDialog.tsx`

## Result

- Both targeted commands passed locally.
- `npx tsc --noEmit --pretty false` was attempted and is currently blocked by unrelated `activityTitle` type errors in quarterly report files.
- `npm run lint:legacy` was also attempted and is blocked by pre-existing unrelated lint errors outside this change.

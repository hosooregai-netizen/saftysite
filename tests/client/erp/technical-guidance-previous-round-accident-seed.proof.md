# Technical Guidance Previous Round Accident Seed Proof

## Covered Contract

- New technical guidance sessions can receive previous-round accident seed values as initial Doc2 state.
- The frontend accepts a missing or null `previous_round_accident` seed without changing the default `accidentOccurred: "no"`.
- Site report list creation and worker calendar launch both pass the seed-derived Doc2 initial values into the shared session creation path.

## Verification

- `npx tsx --test lib/safetyApiMappers/reportsPayload.test.ts`
- `npx eslint lib/safetyApiMappers/reports.ts lib/safetyApiMappers/reportsPayload.test.ts types/backend.ts features/site-reports/hooks/useSiteReportListState.ts features/calendar/components/WorkerCalendarScreen.tsx hooks/inspectionSessions/mutations.ts`

## Result

- Both targeted commands passed locally.
- `npm run lint:legacy` was also attempted and is blocked by pre-existing unrelated lint errors outside this change.

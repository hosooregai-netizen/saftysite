# Worker Calendar Same-Date Rounds Proof

## Scope

- Worker calendar rows no longer drop a later round just because an earlier round on the same date has a linked report.
- Desktop and mobile worker calendar cleanup effects no longer clear same-date schedule rows automatically.

## Validation

- `npx tsx features/calendar/components/workerCalendarReportMatching.test.ts`
  - passed
- `npx tsc --noEmit --pretty false`
  - passed

## Regression Case

- Site has round 7 and round 8 both planned for `2026-04-30`.
- Round 7 has `linkedReportKey`.
- Round 8 is still `planned` with no linked report.
- Expected: both round 7 and round 8 remain in worker calendar rows.

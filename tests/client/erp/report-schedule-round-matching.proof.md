# ERP Proof: Report Schedule Round Matching

## Covered Behavior

- Site report creation derives the next round from the loaded report list, then uses the matching schedule round when available.
- Auto-generated report titles are rebuilt after the schedule round is known so the title number and stored visit round stay aligned.
- Worker calendar report matching prefers explicit linked report keys and schedule ids before falling back to round-only matching.
- Existing linked schedules persist report date changes even when the linked report key itself did not change.
- Schedule/report sync plans reorder a site's schedules and report links by visit date while keeping schedule row round numbers fixed.
- Contract-period validation blocks out-of-range visit dates, and dispatched reports block date/round moves.
- Worker calendar, mobile calendar, report creation, and report guidance-date edits all use the same sync planner.

## Verification

- `npx tsx --test features\schedule-report-sync\scheduleReportSync.test.ts features\calendar\components\workerCalendarReportMatching.test.ts features\inspection-session\lib\applyInspectionSessionGuidanceDateChange.test.ts lib\calendar\apiClient.test.ts lib\safetyApiMappers\reportsPayload.test.ts`
- `npx tsc --noEmit --pretty false` is currently blocked by existing HWPX/template type errors outside this batch.

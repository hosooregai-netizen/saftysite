# ERP Proof: Report Guidance Date Schedule Sync

## Covered Behavior

- Changing the report guidance date updates the report date metadata, auto-generated title, and default follow-up confirmation dates.
- Reports created from worker calendar schedules retain the schedule round number so later report saves can keep only matching schedule links.
- Linked schedule updates are partial-safe and can update planned and actual visit dates without clearing unrelated schedule fields.

## Verification

- `npx tsx --test features\inspection-session\lib\applyInspectionSessionGuidanceDateChange.test.ts lib\calendar\apiClient.test.ts lib\safetyApiMappers\reportsPayload.test.ts`
- `npx tsc --noEmit --pretty false` is currently blocked by existing HWPX/template type errors outside this batch.

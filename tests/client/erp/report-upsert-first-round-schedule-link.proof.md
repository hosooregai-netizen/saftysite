# ERP Proof: Report Upsert First Round Schedule Link

## Covered Behavior

- First-round technical guidance report saves do not send a stale or unverified schedule link.
- Report saves keep `schedule_id` only when the stored schedule round matches the current report round.
- Manual round changes clear the previous schedule link so upstream visit-date ordering validation does not compare against the wrong round.

## Verification

- `npx tsx --test lib\safetyApiMappers\reportsPayload.test.ts`

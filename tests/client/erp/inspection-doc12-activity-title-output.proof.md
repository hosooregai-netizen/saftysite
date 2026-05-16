# Inspection Doc12 Activity Title Output Proof

## Scope

- Doc12 activity title editing in desktop and mobile inspection sessions.
- Session normalization and report payload mapping for `activityTitle`.
- HWPX output mapping for Doc12 activity rows and measurement checks.

## Verification

- `npx tsx --test server/documents/inspection/hwpx.test.ts server/documents/inspection/standardHwpx.test.ts lib/safetyApiMappers/reportsPayload.test.ts`
- `npx tsc --noEmit --pretty false`

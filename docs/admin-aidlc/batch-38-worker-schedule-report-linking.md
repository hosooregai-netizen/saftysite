# Batch 38 - Worker Schedule Report Linking

## Summary
- worker schedule read/patch routes pass `linked_report_key` and `actual_visit_date` without introducing a worker create contract
- admin schedule snapshot invalidation stays active for worker schedule writes
- server admin helpers keep worker schedule proxy support aligned with the existing worker PATCH payload

## Scope
- `server/admin/safetyApiServer.ts`
- `server/admin/scheduleSnapshot.ts`
- `server/admin/automation.ts`
- `app/api/me/schedules/route.ts`
- `app/api/me/schedules/[scheduleId]/route.ts`

## Proof
- `npx tsx tests/client/runSmoke.ts worker-calendar`
- `npx next build --webpack`

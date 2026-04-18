# Admin AIDLC Batch 20: Notifications Removal

## Goal

- remove the notification bell and `/api/notifications*` flow that was adding load and timeout pressure
- keep schedule editing working without writing notification memo side effects

## Scope

- frontend notification UI, client helpers, Next API routes, and admin proxy mapping
- worker header rendering after the bell removal
- backend `/notifications` router, feed models/services, and `notification_reads` index setup

## Contract Pack

- admin proof: `tests/client/contracts/adminContracts.ts`
- erp proof: `tests/client/contracts/erpContracts.ts`

## Validation Commands

- `npx eslint "components/worker/WorkerAppHeader.tsx" "app/api/admin/schedules/[scheduleId]/route.ts" "app/api/me/schedules/[scheduleId]/route.ts" "server/admin/safetyApiServer.ts" "server/admin/upstreamMappers.ts" "types/backend.ts"`
- `py -3 -m pytest tests/test_indexes.py`

## Implementation Record

- removed `NotificationBell`, notification API routes, notification API client, notification types, and local schedule notification memo helpers
- updated admin and worker schedule patch routes to persist only the schedule memo returned by `updateSingleSchedule`
- removed backend notification router wiring, notification feed models/services, and the `notification_reads` index assertion

## Residual Debt

- docs that still mention notification flows have not been cleaned up yet
- if a lighter alert surface is needed later, it should be rebuilt from a simpler source than the deleted feed pipeline

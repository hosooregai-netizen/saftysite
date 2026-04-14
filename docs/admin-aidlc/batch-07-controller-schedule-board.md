# Batch 07 - Controller Schedule Board

## Scope

- remove the manual round-generation action from the admin schedules section
- derive schedule rows from `contractDate + 15-day intervals + totalRounds`
- make admin and worker schedule APIs share the same local schedule source
- add controller calendar drag-move inside each round window
- add schedule detail modal actions including site deep link
- add local in-app schedule change notifications for affected workers
- keep the schedule modal on selection-reason inputs only and drop exception-code/memo entry
- keep the controller calendar defaulted to the current month while hinting when schedules exist in other months
- split controller schedule reads into calendar/queue/lookup responses backed by a server snapshot
- move month navigation out of the filter menu and remove controller-only scope toggles
- show selected worker schedules as month-grid chips in the controller calendar

## Contract surfaces

- `/api/admin/schedules`
- `/api/admin/schedules/calendar`
- `/api/admin/schedules/queue`
- `/api/admin/schedules/lookups`
- `/api/admin/schedules/[scheduleId]`
- `/api/me/schedules`
- `/api/me/schedules/[scheduleId]`
- `/api/notifications`
- `/api/notifications/[notificationId]/ack`
- `/api/notifications/ack-all`
- `site.memo` schedule envelope in `lib/admin/siteContractProfile.ts`

## Guardrails

- schedule rows must never exceed `1..totalRounds`
- drag move must only succeed inside `windowStart ~ windowEnd`
- worker and admin schedule screens must read the same local rows
- schedule change notifications remain in-app only
- existing memo payloads must keep contract/photo/material data intact
- current-month schedule fetches must not silently drop rows because of low API limits
- controller month navigation must stay outside the filter menu
- controller schedule UI must not show `전체 일정 / 내 일정` scope toggles

## Verification

- `npx tsc --noEmit --pretty false`
- `npm run test:client:smoke -- admin-sites`
- `npm run test:client:smoke -- admin-control-center`
- `git diff --check`

## Notes

- local schedule notifications are stored in `site.memo` and merged into `/api/notifications`
- controller schedule data now uses 5-minute session cache on the client and a server snapshot on the API side

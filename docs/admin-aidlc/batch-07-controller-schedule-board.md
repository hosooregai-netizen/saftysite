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

## Contract surfaces

- `/api/admin/schedules`
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

## Verification

- `npx tsc --noEmit --pretty false`
- `git diff --check`

## Notes

- real/mocked smoke was not run in this pass because no local admin app was running for Playwright
- local schedule notifications are stored in `site.memo` and merged into `/api/notifications`

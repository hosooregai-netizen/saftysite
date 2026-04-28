# Batch 74 - Admin Schedule Read Only and Worker Mobile Link

## Scope

- admin schedule registration/edit permission alignment
- worker desktop/mobile schedule date validation parity
- mobile worker schedule-to-technical-guidance report linking

## What Changed

- changed admin schedules UI to read-only detail review with no save, empty-cell registration, or drag move action
- changed admin schedule PATCH route to return 403 after admin auth succeeds
- added desktop worker contract-window blocking to match mobile behavior
- added mobile worker existing schedule edit entry and automatic technical-guidance report creation/linking after schedule save
- updated admin schedule smoke and feature contract to expect read-only behavior

## Why

- product policy says workers register and edit schedules while admins only confirm existing schedules
- desktop and mobile worker schedule registration should enforce the same contract-window rule
- mobile schedule registration should create or link the matching technical-guidance report like desktop

## Validation

- `npx eslint features/admin/sections/schedules/SchedulesSection.tsx features/calendar/components/WorkerCalendarScreen.tsx features/mobile/components/MobileWorkerCalendarScreen.tsx app/api/admin/schedules/[scheduleId]/route.ts tests/client/admin/admin-schedules.spec.ts tests/client/contracts/adminContracts.ts`
- `npx tsc --noEmit --pretty false`
- `python -m pytest tests/test_schedule_selection.py tests/test_schedule_merge.py`
- `npx tsx tests/client/runSmoke.ts admin-schedules`

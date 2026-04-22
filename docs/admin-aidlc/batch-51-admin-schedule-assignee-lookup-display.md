# Batch 51 - Admin Schedule Assignee Lookup Display

## Scope

- admin schedules assignee display normalization
- schedule table sorting aligned with resolved assignee names

## What Changed

- updated `features/admin/sections/schedules/SchedulesSection.tsx`
- resolved visible assignee labels from `assignee_user_id -> lookups.users` before falling back to upstream `assignee_name`
- applied the resolved name to calendar chips, day-list labels, queue rows, selected rows, and schedule detail summary
- aligned assignee column sorting with the same resolved display name

## Why

- some live schedule rows carry stale upstream `assignee_name` strings even when `assignee_user_id` points to the correct worker
- the admin schedules screen should show the actual assigned worker consistently instead of trusting mismatched legacy strings

## Validation

- `pnpm exec eslint features/admin/sections/schedules/SchedulesSection.tsx`
  - passes with non-blocking unused-helper warnings in this file

## Notes

- this is a UI-side normalization only; no admin API payloads or upstream schedule records were mutated

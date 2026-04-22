# Batch 50 - Admin Schedule Display Labels

## Scope

- admin schedules calendar and day-list label cleanup
- active schedule summary title alignment

## What Changed

- updated `features/admin/sections/schedules/SchedulesSection.tsx`
- standardized visible schedule labels to `[지도요원명] 현장명`
- moved round information out of the main summary title into the meta line

## Why

- the schedule identity should stay short and consistent anywhere the operator scans a list
- round and company details are still useful, but they read better as supporting meta than as the primary label

## Validation

- `pnpm exec eslint features/admin/sections/schedules/SchedulesSection.tsx`
  - passes with one existing warning for unused `isDateWithinWindow`

## Notes

- no admin API or backend mapper changes were required

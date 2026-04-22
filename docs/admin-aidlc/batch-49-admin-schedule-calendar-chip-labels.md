# Batch 49 - Admin Schedule Calendar Chip Labels

## Scope

- admin schedules calendar chip label cleanup
- worker schedule/report link persistence follow-up staged alongside this batch

## What Changed

- updated `features/admin/sections/schedules/SchedulesSection.tsx`
- changed calendar chip labels from round-heavy text to `[지도요원명] 현장명`
- removed the extra chip meta line that repeated site, headquarter, and assignee names

## Why

- the calendar cards were visually repeating the same schedule identity twice
- operators only needed the concise assignee + site pairing for quick scanning

## Validation

- `npx eslint features/admin/sections/schedules/SchedulesSection.tsx`
  - passes with one pre-existing warning for unused `isDateWithinWindow`
- `npx tsc --noEmit --pretty false`
  - passes

## Notes

- no admin API changes were required
- the worker schedule-link persistence fix remains in the same commit because it was part of the same working fix set

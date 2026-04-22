# Admin Schedule Display Labels Proof

## Covered Change

- `features/admin/sections/schedules/SchedulesSection.tsx`

## Expected Result

- calendar chips render `[지도요원명] 현장명`
- day-list rows use the same label format
- active schedule summary title uses the same concise label, while round information remains in meta text

## Validation Notes

- `pnpm exec eslint features/admin/sections/schedules/SchedulesSection.tsx`
  - passes with one existing unused-function warning unrelated to this change

## Manual Review

- verified the shared label builder returns only assignee plus site name
- verified summary title no longer repeats round information in the primary label

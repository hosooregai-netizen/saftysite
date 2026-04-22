# Admin Schedule Calendar Chip Labels Proof

## Covered Change

- `features/admin/sections/schedules/SchedulesSection.tsx`

## Expected Result

- admin calendar chips show `[지도요원명] 현장명`
- the duplicate secondary text line is not rendered

## Validation Notes

- `npx eslint features/admin/sections/schedules/SchedulesSection.tsx`
  - passes with one existing unused-function warning unrelated to this change
- `npx tsc --noEmit --pretty false`
  - passes

## Manual Review

- verified the chip title builder now returns only assignee + site
- verified the chip meta span was removed from the calendar chip render path

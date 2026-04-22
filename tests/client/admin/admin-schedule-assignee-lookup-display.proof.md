# Admin Schedule Assignee Lookup Display Proof

## Covered Change

- `features/admin/sections/schedules/SchedulesSection.tsx`

## Expected Result

- schedule chips render `[지도요원명] 현장명` using the resolved user lookup name when `assignee_user_id` is present
- selected/queue tables and the schedule detail modal show the same normalized assignee name
- assignee sort order follows the displayed names instead of stale upstream text

## Validation Notes

- `pnpm exec eslint features/admin/sections/schedules/SchedulesSection.tsx`
  - passes with non-blocking unused-helper warnings in this file

## Manual Review

- verified `resolveScheduleAssigneeName` prefers `userNameById.get(row.assigneeUserId)`
- verified display builders and assignee cells call the shared resolver
- verified schedule sorting uses the same resolver for the `assigneeName` column

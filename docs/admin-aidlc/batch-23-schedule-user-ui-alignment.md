# Admin AIDLC Batch 23: Schedule and User UI Alignment

## Goal

Align the admin schedule board and user management surface with the April 16 ERP meeting memo
without breaking the existing admin smoke flows.

## Scope

- `features/admin/sections/schedules/SchedulesSection.tsx`
- `features/calendar/components/WorkerCalendarScreen.tsx`
- `features/admin/sections/users/UsersTable.tsx`
- `features/admin/sections/users/UsersSection.tsx`
- `features/admin/sections/AdminSectionShared.module.css`
- `features/calendar/components/WorkerCalendarScreen.module.css`
- `tests/client/admin/admin-schedules.spec.ts`

## Implementation Record

### Expected outputs

- Admin and worker calendars should allow dates outside the contract window while keeping the
  existing out-of-window warning signal visible.
- Schedule dialogs should only require selection-reason fields when the operator explicitly turns
  on reason recording.
- Calendar cells should be denser, and the admin `더보기` entry should open the hidden rows for
  that exact date instead of a generic same-day list.
- User management should emphasize `로그인 ID(이메일) / 소속 / 전화번호 / 직책 / 담당 현장 수`
  instead of long inline assigned-site chip lists.

### Actual results

- Admin schedule save, quick-move, and worker schedule save no longer block dates outside the
  window at the client layer.
- Both schedule dialogs now expose a `변경 사유 기록` toggle and only submit
  `selectionReasonLabel/selectionReasonMemo` when the toggle is on.
- Admin calendar cells and worker calendar cells were compressed to reduce vertical height.
- Admin calendar `더보기` now opens the hidden rows for the selected day, and the modal labels that
  list as `숨은 일정`.
- Admin users now render a simplified table centered on login ID, organization, phone, position,
  assigned-site count, and a short first-site summary.

## Validation

- `npx tsc --noEmit --pretty false`
- `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3100 npm run test:client:smoke -- admin-control-center admin-headquarters admin-reports admin-sites admin-schedules admin-users`

## Notes

- Worker calendar was manually checked against the local app with an agent account to confirm login,
  calendar entry, and dialog rendering. The current local data did not include a selectable round,
  so the worker save path was not exercised end-to-end in this environment.

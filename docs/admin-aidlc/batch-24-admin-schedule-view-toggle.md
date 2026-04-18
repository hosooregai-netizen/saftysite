# Admin AIDLC Batch 24: Admin Schedule View Toggle

## Goal

Bring the controller schedule surface in line with the worker schedule board by exposing
`달력으로 보기 / 목록으로 보기` as a first-class toggle while keeping the existing schedule
edit flows intact.

## Scope

- `features/admin/sections/schedules/SchedulesSection.tsx`
- `features/admin/sections/AdminSectionShared.module.css`
- `tests/client/admin/admin-schedules.spec.ts`
- `scripts/smoke-real-client/worker-flow.ts`
- `docs/reverse-specs/admin-schedules-section-reverse-spec.md`

## Implementation Record

### Expected outputs

- Controllers can switch between calendar and list modes on `/admin?section=schedules`.
- Calendar mode keeps the dense month board and drag/move behavior.
- List mode shows both the unselected queue and the selected schedule table without requiring the
  operator to click back into a calendar cell first.
- Worker schedule smoke should prove that saving a schedule makes the saved date and reason appear
  in the worker list view.

### Actual results

- Admin schedules now persist a `view=list` query param for the list mode and default back to the
  calendar mode when the param is absent.
- The selected schedule table no longer inherits a stale `selectedDate` filter while list mode is
  active.
- Client smoke now asserts that both schedule view tabs render and can switch between the queue/list
  mode and the month calendar mode.
- Real worker smoke now checks that the just-saved schedule date and selection reason are visible
  after switching to the worker list view.

## Validation

- `npx tsc --noEmit --pretty false`
- `PORT=3211 npm run dev`
- `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3211 npm run test:client:smoke -- admin-schedules`

## Notes

- Worker live verification still depends on a real worker credential. The smoke script now contains
  the contract we expect once those credentials are provided.

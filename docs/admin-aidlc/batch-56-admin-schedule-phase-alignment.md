# Batch 56 - Admin Schedule Phase Alignment

## Scope

- align admin schedule calendar chip phases with the legacy controller board
- derive a read-only display phase for selected schedules without changing the persisted schedule API
- keep overdue warning emphasis scoped to true planned rows so linked report rows are not painted as delayed by default

## What Changed

- updated `features/admin/sections/schedules/SchedulesSection.tsx`
- updated `features/admin/sections/AdminSectionShared.module.css`
- updated `tests/client/admin/admin-schedules.spec.ts`
- updated `docs/reverse-specs/admin-schedules-section-reverse-spec.md`

## Why

- the current controller calendar only rendered a default chip tone plus overdue warning
- legacy operators expect:
  - green for `완료`
  - blue for `기술지도 진행중`
  - gray for `예정`
- linked schedules that already had a report/session connection were being shown with the same tone as plain planned rows, and overdue planned styling could override the intended legacy phase
- imported legacy report links represent completed historical visits and should not stay blue as if they were still being written

## Validation

- `pnpm exec eslint features/admin/sections/schedules/SchedulesSection.tsx features/admin/sections/AdminSectionShared.module.css tests/client/admin/admin-schedules.spec.ts`
- `pnpm exec tsx tests/client/runSmoke.ts admin-schedules`

## Notes

- display phase is derived in the admin UI from existing schedule data
- persisted schedule `status` values stay unchanged
- `기술지도 진행중` is shown whenever a linked report exists but the visit is not yet marked complete, including legacy draft/reservation rows
- `완료` is shown when the visit has an `actualVisitDate` or the linked legacy report is matched as submitted/completed

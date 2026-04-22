# Admin Schedule Phase Alignment Proof

## Covered Change

- `features/admin/sections/schedules/SchedulesSection.tsx`
- `features/admin/sections/AdminSectionShared.module.css`

## Expected Result

- admin calendar chips use legacy-style phase tones
- `completed` rows render as completed phase
- linked report rows render as `기술지도 진행중`
- plain planned rows render as `예정`
- overdue warning emphasis only overrides true planned rows

## Validation Notes

- `pnpm exec eslint features/admin/sections/schedules/SchedulesSection.tsx features/admin/sections/AdminSectionShared.module.css tests/client/admin/admin-schedules.spec.ts`
- `pnpm exec tsx tests/client/runSmoke.ts admin-schedules`

## Manual Review

- verified the shared schedule display-phase helper classifies linked rows as `기술지도 진행중`
- verified the admin schedules smoke checks the linked fixture row through the dialog status summary
- verified calendar chip tone classes now distinguish completed / in-progress / planned rows

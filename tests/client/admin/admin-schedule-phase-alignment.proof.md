# Admin Schedule Phase Alignment Proof

## Covered Change

- `features/admin/sections/schedules/SchedulesSection.tsx`
- `features/admin/sections/AdminSectionShared.module.css`

## Expected Result

- admin calendar chips use legacy-style phase tones
- `completed` rows render as completed phase
- linked report rows without a completion visit date render as `기술지도 진행중`
- legacy submitted/completed rows are normalized to `완료`
- plain planned rows render as `예정`
- overdue warning emphasis only overrides true planned rows

## Validation Notes

- `pnpm exec eslint features/admin/sections/schedules/SchedulesSection.tsx features/admin/sections/AdminSectionShared.module.css tests/client/admin/admin-schedules.spec.ts`
- `pnpm exec tsx --test features/admin/sections/schedules/scheduleDisplayPhase.test.ts`
- `pnpm exec tsx tests/client/runSmoke.ts admin-schedules`

## Manual Review

- verified the shared schedule display-phase helper keeps linked rows without visit completion as `기술지도 진행중`
- verified the legacy schedule alignment helper upgrades submitted legacy rows to `완료`
- verified the admin schedules smoke checks both linked fixture variants through the dialog status summary
- verified calendar chip tone classes now distinguish completed / in-progress / planned rows

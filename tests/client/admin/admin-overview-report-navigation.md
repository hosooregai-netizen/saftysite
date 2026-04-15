## Admin Proof Note

- Scope: `features/admin/**`
- Intent:
  - Keep overview unsent-report rows aligned with the actual report type.
  - Prevent overview priority-quarterly and unsent-report rows from using stale upstream href values when local fallback links are safer.
- Checks:
  - `npx tsc --noEmit`
  - `./node_modules/.bin/eslint.cmd --max-warnings=0 features/admin/lib/control-center-model/overviewModel.ts features/admin/sections/overview/useAdminOverviewSectionState.ts`

## Admin Proof Note

- Scope: `features/admin/**`
- Intent:
  - Keep overview unsent-report rows out of the global reports filter flow.
  - Route overview unsent-report rows to the site's technical-guidance report list.
  - Route overview priority-quarterly rows to the site's quarterly report list.
  - Route per-site overdue/deadline helper rows to site-centered destinations.
  - Keep aggregate missing-dispatch signal links in the global reports filter flow.
- Checks:
  - `npx tsc --noEmit`
  - `./node_modules/.bin/eslint.cmd --max-warnings=0 features/admin/lib/control-center-model/overviewModel.ts features/admin/lib/control-center-model/overviewPolicies.ts features/admin/sections/overview/useAdminOverviewSectionState.ts tests/client/admin/admin-control-center.spec.ts`
  - `npm run test:client:feature -- admin-control-center`

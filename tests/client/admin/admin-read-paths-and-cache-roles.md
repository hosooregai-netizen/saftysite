## Admin Proof Note

- Scope: `app/api/admin/**`, `app/api/safety/**`, `features/admin/**`, `server/admin/**`
- Intent:
  - Stabilize admin overview stale-while-revalidate behavior and in-flight dedupe.
  - Preserve upstream overview rows during policy-overlay merge.
  - Reduce overview route overhead by reusing upstream site-status summary.
  - Clarify canonical read paths and cache roles for overview, reports, analytics, and schedules.
  - Make route invalidation and bootstrap cache invalidation explicit for report and directory mutations.
- Checks:
  - `npm run lint`:
    - fails on pre-existing `react-hooks/set-state-in-effect` errors in `features/admin/sections/analytics/useAnalyticsSectionState.ts` and `features/admin/sections/users/useUsersSectionState.ts`
    - changed-file lint passes with `npx eslint ...` across the staged admin files
  - `node --import tsx --test app/api/admin/dashboard/overview/route.test.ts features/admin/lib/adminClientCacheInvalidation.test.ts server/admin/adminRouteInvalidation.test.ts server/admin/overviewPolicyOverlay.test.ts server/admin/overviewRouteCache.test.ts server/admin/reportsRouteCache.test.ts`
  - Manual smoke:
    - overview first entry renders immediately and revalidates in background
    - dispatch mutation reduces overview dispatch-management counts on next entry
    - overview unsent / priority rows stay populated after route merge

# Batch 14: Overview Report Navigation

## Summary

- Replaced the previous admin overview report-filter row links with site-centered report-list links.
- Replaced the admin overview row navigation for dispatch and priority-quarterly rows with site-centered destinations:
  - dispatch-management rows open the site's technical-guidance report list.
  - priority-quarterly rows open the site's quarterly report list.
- Pointed per-site overdue/deadline helper rows at site-centered destinations as well.
- Preferred locally derived overview links for unsent-report and priority-quarterly rows when upstream overview payloads provide stale or incorrect href values.
- Kept the aggregate missing-dispatch signal links on the global reports filter flow.
- Stabilized the admin control-center smoke coverage so overview and analytics checks follow the current UI flow without depending on optional overview tables.
- Wrapped the direct legacy report PDF fallback route in a Suspense boundary so `/admin/report-open` can be prerendered during production builds.
- Extended the admin reports smoke proof to cover direct `/admin/report-open?reportKey=...` entry without navigating to the authoring session screen.
- Stabilized the admin dashboard first load by removing auth-time controller bulk priming and the overview policy overlay report pagination call.
- Split admin dashboard lazy loading so overview starts from the summary API only, photos loads sites only, and mailbox loads only sites/headquarters plus its report list.
- Added an in-flight admin reports request dedupe so the reports section keeps one initial `/api/admin/reports` call under React StrictMode.

## Changed Files

- `features/admin/lib/control-center-model/overviewModel.ts`
- `features/admin/lib/control-center-model/overviewPolicies.ts`
- `features/admin/sections/overview/useAdminOverviewSectionState.ts`
- `tests/client/admin/admin-control-center.spec.ts`
- `app/admin/report-open/page.tsx`
- `tests/client/admin/admin-reports.spec.ts`
- `tests/client/admin/admin-overview-report-navigation.md`
- `hooks/inspectionSessions/useInspectionSessionAuthSync.ts`
- `features/admin/hooks/useAdminDashboardDataLoaders.ts`
- `features/admin/hooks/useAdminDashboardRouting.ts`
- `features/admin/hooks/useAdminDashboardState.ts`
- `features/admin/sections/reports/useReportsSectionState.ts`
- `app/api/admin/dashboard/overview/route.ts`
- `tests/client/admin/admin-control-center.spec.ts`
- `tests/client/admin/admin-reports.spec.ts`

## Validation

- `npx tsc --noEmit`
- `./node_modules/.bin/eslint.cmd --max-warnings=0 features/admin/lib/control-center-model/overviewModel.ts features/admin/lib/control-center-model/overviewPolicies.ts features/admin/sections/overview/useAdminOverviewSectionState.ts tests/client/admin/admin-control-center.spec.ts`
- `npm run test:client:feature -- admin-control-center`
- `npm run build`
- `npx tsc --noEmit --pretty false`
- `npx eslint --max-warnings=0 -- app/admin/report-open/page.tsx tests/client/admin/admin-reports.spec.ts`
- `npm run test:client:smoke -- admin-reports`
- `npx eslint --max-warnings=0 -- hooks/inspectionSessions/useInspectionSessionAuthSync.ts features/admin/hooks/useAdminDashboardDataLoaders.ts features/admin/sections/reports/useReportsSectionState.ts app/api/admin/dashboard/overview/route.ts tests/client/admin/admin-control-center.spec.ts tests/client/admin/admin-reports.spec.ts`
- `npm run test:client:smoke -- admin-control-center admin-reports`

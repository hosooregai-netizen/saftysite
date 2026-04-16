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

## Changed Files

- `features/admin/lib/control-center-model/overviewModel.ts`
- `features/admin/lib/control-center-model/overviewPolicies.ts`
- `features/admin/sections/overview/useAdminOverviewSectionState.ts`
- `tests/client/admin/admin-control-center.spec.ts`
- `app/admin/report-open/page.tsx`
- `tests/client/admin/admin-reports.spec.ts`
- `tests/client/admin/admin-overview-report-navigation.md`

## Validation

- `npx tsc --noEmit`
- `./node_modules/.bin/eslint.cmd --max-warnings=0 features/admin/lib/control-center-model/overviewModel.ts features/admin/lib/control-center-model/overviewPolicies.ts features/admin/sections/overview/useAdminOverviewSectionState.ts tests/client/admin/admin-control-center.spec.ts`
- `npm run test:client:feature -- admin-control-center`
- `npm run build`
- `npx tsc --noEmit --pretty false`
- `npx eslint --max-warnings=0 -- app/admin/report-open/page.tsx tests/client/admin/admin-reports.spec.ts`
- `npm run test:client:smoke -- admin-reports`

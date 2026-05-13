# Site Report List Legacy Dispatch Toggle Proof

## Covered Contract

- Legacy technical-guidance rows in the shared admin site report list keep opening as read-only original PDFs.
- Legacy rows can still be manually marked sent or pending from the site report row menu.
- Legacy dispatch mutations use the admin dispatch API and update the legacy site-report cache so the changed dispatch state survives immediate page re-entry.
- Normal technical-guidance dispatch mutations also invalidate admin report caches when the current user is an admin, without touching admin cache scope for field users.
- Quarterly report dispatch mutations update the operational report index cache from the PATCH response before force revalidation completes.
- Existing field report dispatch cache rollback protection remains intact.

## Verification

- `npx tsx features/site-reports/report-list/adminLegacySiteReportCache.test.ts`
- `npx tsx hooks/inspectionSessions/helpers.test.ts`
- `npx tsx lib/reportDispatch.test.ts`
- `npx tsc --noEmit`
- `npx eslint features/site-reports/components/SiteReportListPanel.tsx features/site-reports/report-list/ReportListRow.tsx features/site-reports/report-list/adminLegacySiteReportCache.ts features/site-reports/report-list/adminLegacySiteReportCache.test.ts tests/client/admin/admin-sites.spec.ts`
- `npx tsx tests/client/runSmoke.ts admin-sites`
- `npx tsx tests/client/runSmoke.ts site-report-list`
- `npx tsx lib/operationalReportIndexCache.test.ts`
- `npx tsx tests/client/runSmoke.ts quarterly-report`

## Result

- All commands passed locally.

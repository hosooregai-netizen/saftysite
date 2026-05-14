# Site Report List Legacy Admin Readonly Proof

## Scope

- admin site detail entry into `/sites/:siteId`
- include legacy technical-guidance rows in the site report list for admin users
- open legacy rows through `/admin/report-open` instead of `/sessions/:reportKey`

## Coverage

- admin site main smoke now opens the site report list from `사업장/현장`
- verifies `레거시 5차 기술지도 보고서` appears in the shared site report list
- verifies the legacy row opens `레거시 원본 PDF 보기` on `/admin/report-open`

## Validation

- `pnpm exec eslint features/site-reports/hooks/useSiteReportListState.ts features/site-reports/components/ReportList.tsx features/site-reports/report-list/ReportListRow.tsx lib/safetyApiMappers/reports.ts types/inspectionSession/session.ts tests/client/admin/admin-sites.spec.ts`
- `pnpm exec tsx tests/client/runSmoke.ts admin-sites`

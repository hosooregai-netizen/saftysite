# ERP Proof Companion: Site Snapshot Resolution And Quarterly Appendix

## Covered Source Areas

- `features/inspection-session/hooks/useInspectionSessionScreen.ts`
- `features/site-reports/hooks/useSiteReportListState.ts`
- `hooks/inspectionSessions/provider.tsx`
- `hooks/inspectionSessions/useInspectionSessionReportLoaders.ts`
- `app/api/documents/quarterly/hwpx/route.ts`
- `app/api/documents/quarterly/pdf/route.ts`
- `server/documents/quarterly/requestResolver.ts`
- `server/documents/quarterly/hwpx.ts`

## Proof Notes

- stale or placeholder site snapshot fields are backfilled before worker report creation and
  quarterly editing continue
- quarterly downloads now resolve the selected technical-guidance sessions before HWPX/PDF export
  so appendix sections can be generated from the same source list

## Existing Smoke Coverage

- `tests/client/erp/site-report-list.spec.ts`
- `tests/client/erp/quarterly-report.spec.ts`

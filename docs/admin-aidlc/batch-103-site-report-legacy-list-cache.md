# Admin AIDLC Batch 103: Site Report Legacy List Cache

## Scope
- Stabilize admin `/sites/:siteId` technical-guidance report list loading by treating normal report index rows and legacy admin report rows as one completed list.
- Add per-admin, per-site session cache for legacy report rows, including empty arrays, with stale fallback during background revalidation.
- Keep legacy original-PDF rows read-only and out of report upsert, dispatch patch, and schedule report-update paths.

## Source Changes
- `features/site-reports/hooks/useSiteReportListState.ts`
- `features/site-reports/report-list/adminLegacySiteReportCache.ts`
- `hooks/inspectionSessions/helpers.ts`
- `features/schedule-report-sync/scheduleReportSync.ts`
- `app/api/admin/reports/route.ts`

## Proof
- `tests/client/admin/admin-sites.spec.ts` now holds the admin legacy reports request to verify no partial normal-only list is rendered as complete, cached re-entry stays visible during revalidation, and legacy rows do not trigger report writes.
- `tests/client/erp/site-report-list.spec.ts` verifies field-agent site report lists do not call `/api/admin/reports`.
- Unit coverage: `features/site-reports/report-list/adminLegacySiteReportCache.test.ts`, `hooks/inspectionSessions/helpers.test.ts`, `lib/reportDispatch.test.ts`, `lib/safetyApiMappers/reportsPayload.test.ts`.

## Validation
- `pnpm exec eslint app/api/admin/reports/route.ts features/admin/lib/adminSessionCache.ts features/schedule-report-sync/scheduleReportSync.ts features/site-reports/components/SiteReportListPanel.tsx features/site-reports/hooks/useSiteReportListState.ts features/site-reports/report-list/adminLegacySiteReportCache.ts features/site-reports/report-list/adminLegacySiteReportCache.test.ts hooks/inspectionSessions/helpers.ts hooks/inspectionSessions/helpers.test.ts lib/admin/reportMeta.ts lib/reportDispatch.ts lib/reportDispatch.test.ts lib/safetyApiMappers/reports.ts lib/safetyApiMappers/reportsPayload.test.ts tests/client/admin/admin-sites.spec.ts tests/client/erp/site-report-list.spec.ts types/inspectionSession/session.ts`
- `pnpm exec tsx --test features/site-reports/report-list/adminLegacySiteReportCache.test.ts hooks/inspectionSessions/helpers.test.ts lib/reportDispatch.test.ts lib/safetyApiMappers/reportsPayload.test.ts`
- `pnpm exec tsx tests/client/runSmoke.ts admin-sites`
- `pnpm exec tsx tests/client/runSmoke.ts site-report-list`

# Batch 15: Legacy Admin Report Bootstrap

## Summary

- Added an admin-only legacy report bootstrap API so legacy technical guidance reports can open the structured inspection session editor even when the general safety `reports/by-key` endpoint cannot hydrate them.
- Updated the admin report-open entry flow and direct legacy session recovery path to hydrate `site`, `session`, and `siteSessions` before routing into `/sessions/[sessionId]`.
- Preserved the original PDF fallback only for cases where the structured bootstrap cannot be reconstructed.

## Changed Files

- `app/admin/report-open/page.tsx`
- `app/api/admin/reports/[reportKey]/session-bootstrap/route.ts`
- `app/sessions/[sessionId]/page.tsx`
- `features/admin/lib/control-center-model/rowEnrichment.ts`
- `features/admin/sections/overview/useAdminOverviewSectionState.ts`
- `features/admin/sections/reports/ReportsTable.tsx`
- `features/admin/sections/reports/useReportsSectionState.ts`
- `features/admin/sections/schedules/SchedulesSection.tsx`
- `features/inspection-session/hooks/useInspectionSessionScreen.ts`
- `hooks/inspectionSessions/context.ts`
- `hooks/inspectionSessions/mutations.ts`
- `hooks/inspectionSessions/provider.tsx`
- `hooks/inspectionSessions/useInspectionSessionStateHydration.ts`
- `lib/admin/apiClient.ts`
- `lib/admin/controllerReports.ts`
- `server/documents/inspection/requestResolver.ts`
- `tests/client/admin/admin-reports.spec.ts`
- `tests/client/admin/admin-schedules.spec.ts`
- `tests/client/fixtures/adminSmokeHarness.ts`
- `types/admin.ts`

## Validation

- `npx tsc --noEmit --pretty false`
- `npm run test:client:smoke -- admin-reports admin-schedules`

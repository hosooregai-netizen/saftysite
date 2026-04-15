# Admin AIDLC Batch 8: Manual Report Dispatch Toggle

## Goal

Add a shared manual dispatch toggle flow so admins, controllers, and field agents can
mark technical guidance and quarterly reports as sent or unsent from list views, while
keeping the admin dashboard unsent metrics aligned to `reports.dispatch`.

## Scope

- Admin reports list manual dispatch toggle actions
- Site technical guidance report list manual dispatch toggle
- Site quarterly report list manual dispatch toggle
- Shared public report dispatch API proxy and payload serializer
- Smoke coverage for admin reports, site report list, and quarterly report list

## Key Decisions

- Persist dispatch state only in backend `reports.dispatch`
- Treat `dispatch_status in {"sent", "manual_checked"}` as completed
- Keep `bad_workplace` rows out of manual toggle actions
- Preserve prior dispatch/mail metadata when toggling back to unsent
- Use one shared dispatch toggle helper so admin and ERP lists generate the same payloads

## Files

- `features/admin/sections/reports/*`
- `features/site-reports/components/SiteReportListPanel.tsx`
- `features/site-reports/components/SiteQuarterlyReportsScreen.tsx`
- `features/site-reports/report-list/ReportListRow.tsx`
- `features/site-reports/quarterly-list/QuarterlyReportsListPanel.tsx`
- `app/api/reports/[reportKey]/dispatch/route.ts`
- `server/admin/safetyApiServer.ts`
- `server/admin/reportDispatchPayload.ts`
- `server/admin/reportsRouteCache.ts`
- `lib/reportDispatch.ts`
- `lib/reportDispatchApi.ts`
- `tests/client/admin/admin-reports.spec.ts`
- `tests/client/erp/site-report-list.spec.ts`
- `tests/client/erp/quarterly-report.spec.ts`

## Verification

- `npx tsc --noEmit`
- `npm run test:client:smoke -- admin-reports site-report-list quarterly-report`

## Notes

- The site technical guidance list applies an immediate local dispatch override after a
  successful toggle so the row updates without waiting on a later index refresh.
- Admin cache invalidation for reports routes is shared so dispatch, review, and dispatch
  event updates keep the admin list consistent.
- Admin report-list toggles now reuse the PATCH response to update the visible row immediately,
  while the analytics snapshot refresh runs in the background instead of blocking the response.
- The admin reports smoke now guards this path by ensuring a manual dispatch toggle does not
  trigger an extra `GET /api/admin/reports` round-trip before the dialog closes.

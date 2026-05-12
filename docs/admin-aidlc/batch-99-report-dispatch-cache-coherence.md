# Admin AIDLC Batch 99: Report Dispatch Cache Coherence

## Scope

- `lib/safetyApi/client.ts`
- `lib/safetyApi/endpoints.ts`
- `hooks/inspectionSessions/useInspectionSessionReportLoaders.ts`
- `features/site-reports/components/SiteReportListPanel.tsx`
- `features/admin/sections/reports/useReportsSectionState.ts`
- `features/admin/lib/adminSessionCache.ts`
- `tests/client/erp/site-report-list.spec.ts`
- `tests/client/admin/report-dispatch-cache-coherence.proof.md`

## Change

- Added generation guards around report GET caches, in-flight requests, inspection report loaders, and local report index persistence.
- Invalidated report read caches and admin dashboard/report-list caches after dispatch mutations from manual toggles, admin actions, SMS, and mail sends.
- Preserved legacy read-only rows while allowing current DB/local report rows to win by `reportKey`.

## Validation

- `npx tsx tests/client/runSmoke.ts site-report-list quarterly-report admin-reports`
- `npx tsx --test lib/reportCachePolicy.test.ts features/admin/lib/adminClientCacheInvalidation.test.ts`
- `npx tsx --test app/api/mail/send/route.test.ts app/api/mail/send-report/route.test.ts lib/safetyApi/endpoints.test.ts`

## Notes

- The site report smoke now covers the delayed stale `/reports?site_id=site-1` race after a successful dispatch PATCH and verifies persisted `inspection-report-index-v2` stays completed.

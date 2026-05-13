# Admin Report Dispatch Cache Coherence Proof

## Covered Contract

- Admin report dispatch mutations invalidate admin report/dashboard session caches.
- Field site report list dispatch mutations cannot be rolled back by stale `/reports` reads.
- Mail/SMS report sends also clear report read caches and route-level admin report caches.

## Verification

- `npx tsx tests/client/runSmoke.ts site-report-list quarterly-report admin-reports`
- `npx tsx --test lib/reportCachePolicy.test.ts features/admin/lib/adminClientCacheInvalidation.test.ts`
- `npx tsx --test app/api/mail/send/route.test.ts app/api/mail/send-report/route.test.ts lib/safetyApi/endpoints.test.ts`
- `npx tsx lib/operationalReportIndexCache.test.ts`
- `npx tsx hooks/inspectionSessions/helpers.test.ts`
- `npx tsx tests/client/runSmoke.ts admin-sites`
- `npx tsx tests/client/runSmoke.ts admin-control-center`

## Result

- All commands passed locally.
- The follow-up operational-index tests cover report-key replacement, dispatch meta preservation, owner/site isolation, stale pre-mutation responses, and force revalidation applying server state.

# Admin Reports Latency Cut Proof

## Scope

- the default admin reports page should request `20` rows instead of `100`
- changing admin reports pagination should reuse the merged row snapshot instead of rebuilding the full dataset for every offset
- legacy technical guidance rows should still appear in the admin reports list even when the upstream admin report view stays trimmed
- legacy original PDF availability should only be shown for report keys that have a verified uploaded PDF manifest entry

## Validation

- `pnpm exec eslint app/api/admin/reports/route.ts server/admin/legacyAdminReportsSnapshot.ts server/admin/legacyAdminReportsSnapshot.test.ts server/admin/reportsRouteCache.ts server/admin/reportsRouteCache.test.ts features/admin/sections/reports/reportsSectionFilters.ts`
- `node --import tsx --test server/admin/reportsRouteCache.test.ts server/admin/legacyAdminReportsSnapshot.test.ts`
- `pnpm exec tsc --noEmit --pretty false`
- `pnpm exec tsx tests/client/runSmoke.ts admin-reports`

## Notes

- The main latency source was not the client page size itself. `/api/admin/reports` was rebuilding the full legacy-enriched dataset from upstream `GET /reports` on first load.
- After this change the route only pages through the fast current admin report view and merges legacy rows from the local snapshot, which removes the repeated full upstream legacy scan from the request path.

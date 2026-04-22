# Admin AIDLC Batch 54: Admin Reports Latency Cut

## Summary

- Reduced the admin reports list page size from `100` to `20` for the normal paginated list so each response ships less table data.
- Added a cached base-row snapshot for `/api/admin/reports` so different offsets within the same session reuse the expensive merged dataset instead of rebuilding it on every page click.
- Removed the heaviest upstream bottleneck by separating the report sources:
  - current reports now come from the fast upstream `GET /admin/reports` view
  - legacy technical guidance rows now come from a committed local snapshot plus directory lookups and the verified PDF manifest
- Kept the legacy PDF behavior aligned with the recent manifest work:
  - only uploaded-and-linked legacy PDFs advertise availability
  - rows without a linked uploaded PDF still remain visible in the list and correctly return `404` when the original PDF is missing

## Changed Files

- `app/api/admin/reports/route.ts`
- `features/admin/sections/reports/reportsSectionFilters.ts`
- `server/admin/reportsRouteCache.ts`
- `server/admin/reportsRouteCache.test.ts`
- `server/admin/legacyAdminReportsSnapshot.ts`
- `server/admin/legacyAdminReportsSnapshot.test.ts`
- `data/legacy-admin-reports.snapshot.jsonl`
- `tests/client/admin/admin-reports-latency-cut.proof.md`

## Validation

- `pnpm exec eslint app/api/admin/reports/route.ts server/admin/legacyAdminReportsSnapshot.ts server/admin/legacyAdminReportsSnapshot.test.ts server/admin/reportsRouteCache.ts server/admin/reportsRouteCache.test.ts features/admin/sections/reports/reportsSectionFilters.ts`
- `node --import tsx --test server/admin/reportsRouteCache.test.ts server/admin/legacyAdminReportsSnapshot.test.ts`
- `pnpm exec tsc --noEmit --pretty false`
- `pnpm exec tsx tests/client/runSmoke.ts admin-reports`

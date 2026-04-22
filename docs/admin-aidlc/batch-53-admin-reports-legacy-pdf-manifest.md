# Admin AIDLC Batch 53: Admin Reports Legacy PDF Manifest

## Summary

- Restored the admin reports list to build from the general safety `GET /reports` dataset plus directory lookups so imported legacy rows are visible again even when the upstream `GET /admin/reports` view stays trimmed.
- Added a server-side legacy PDF manifest sourced from the verified last-twelve-month upload batch so report rows can advertise original-PDF availability without mutating fragile legacy report records in place.
- Updated the admin original-PDF route to use the manifest as a fallback before returning `404`, while keeping the direct legacy login fallback removed as requested.

## Changed Files

- `app/api/admin/reports/route.ts`
- `app/api/admin/reports/[reportKey]/original-pdf/route.ts`
- `data/legacy-admin-report-original-pdfs.json`
- `tests/client/admin/admin-reports-legacy-pdf-manifest.proof.md`

## Validation

- `pnpm exec eslint app/api/admin/reports/route.ts 'app/api/admin/reports/[reportKey]/original-pdf/route.ts`
- `pnpm exec tsc --noEmit --pretty false`
- `pnpm exec tsx tests/client/runSmoke.ts admin-reports`

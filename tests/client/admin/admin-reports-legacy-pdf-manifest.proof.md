# Admin Reports Legacy PDF Manifest Proof

## Scope

- admin reports list should keep using the local enriched dataset so legacy imported reports are not limited by the upstream trimmed admin view
- legacy technical guidance rows should continue opening as in-app original PDF, and the PDF route should be allowed to resolve uploaded `/uploads/content-items/...` assets from the manifest fallback
- missing PDFs should stop at the normal `404` response instead of attempting a direct legacy login fallback

## Validation

- `pnpm exec eslint app/api/admin/reports/route.ts 'app/api/admin/reports/[reportKey]/original-pdf/route.ts`
- `pnpm exec tsc --noEmit --pretty false`
- `pnpm exec tsx tests/client/runSmoke.ts admin-reports`

## Notes

- Verified the uploaded asset path resolves from the upstream origin as `200 application/pdf`, so the remaining issue was the missing report-to-asset linkage rather than a missing PDF object.

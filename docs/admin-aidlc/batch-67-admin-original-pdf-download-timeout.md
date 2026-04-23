# Batch 67: Admin Original PDF Download Timeout

## Intent

- Keep large original-PDF reads from failing on the default 15s safety-server timeout.
- Prefer direct archive/download paths for original PDFs when report metadata already points to a concrete asset.
- Extend large-file proxy tolerance for upload/download style paths without widening the default admin timeout for ordinary reads.

## Admin Contract Impact

- `server/admin/safetyApiServer.ts` now treats `original-pdf`, upload, and content-asset download paths as file-download requests with a 120s timeout budget.
- `server/admin/originalPdfDocument.ts` now prefers direct archive/download paths from report metadata before falling back to the backend `original-pdf` endpoint.
- `lib/safetyApi/proxy.ts` now gives upload and original-PDF proxy traffic the same longer timeout budget.

## Deployment Notes

- No new environment variables are required.
- This change reduces timeout pressure for large original PDFs but does not change attachment-size limits or mail-provider limits.

## Verification

- `pnpm exec tsx --test server/admin/safetyApiServer.test.ts server/admin/originalPdfDocument.test.ts lib/safetyApi/proxy.test.ts`
- `pnpm exec eslint lib/safetyApi/proxy.ts server/admin/safetyApiServer.ts server/admin/originalPdfDocument.ts server/admin/safetyApiServer.test.ts server/admin/originalPdfDocument.test.ts`
- `pnpm exec tsc --noEmit --pretty false`

# Batch 18: Original PDF Asset Fallback

## Summary

- Updated the admin original PDF proxy to treat stored content asset paths as first-class candidates.
- Added support for camel-case PDF metadata keys used by older report payloads.
- Decoded URL-encoded archive paths before deriving `/uploads/content-items/` and `content_assets` candidates.
- Avoided converting the admin original-PDF API path itself into a fake asset filename during fallback probing.

## Changed Files

- `app/api/admin/reports/[reportKey]/original-pdf/route.ts`
- `tests/client/admin/admin-original-pdf-asset-fallback.md`

## Validation

- `npx tsc --noEmit`


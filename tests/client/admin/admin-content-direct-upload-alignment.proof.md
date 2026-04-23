# Admin Content Direct Upload Alignment Proof

## Covered Change

- `features/admin/sections/content/ContentItemsSection.tsx`
- `lib/safetyApi/assets.ts`
- `lib/photos/apiClient.ts`
- `lib/safetyApi/uploadTransport.ts`
- `lib/safetyApi/upstream.ts`

## Expected Result

- admin content asset fields show a shared proxy warning only when direct upload is unavailable
- content asset uploads prefer the configured HTTPS direct-upload origin
- photo uploads prefer the configured HTTPS direct-upload origin
- small direct-upload 404/405 failures can fall back to proxy uploads
- oversized uploads do not fall back to proxy and instead point operators to `NEXT_PUBLIC_SAFETY_UPLOAD_UPSTREAM_BASE_URL`

## Validation Notes

- `npx tsx --test lib/safetyApi/uploadTransport.test.ts lib/safetyApi/assets.test.ts lib/photos/apiClient.test.ts`
- `npx eslint features/admin/sections/content/ContentItemsSection.tsx lib/photos/apiClient.ts lib/photos/apiClient.test.ts lib/safetyApi/assets.ts lib/safetyApi/assets.test.ts lib/safetyApi/uploadTransport.ts lib/safetyApi/uploadTransport.test.ts lib/safetyApi/upstream.ts scripts/rundev.mjs`

## Manual Review

- verified the admin content section now reuses shared helper text for proxy-only uploads
- verified direct-upload target selection rejects insecure `http` targets when the page is on `https`
- verified the local dev launcher now seeds `NEXT_PUBLIC_SAFETY_UPLOAD_UPSTREAM_BASE_URL` from the same asset-origin family used for uploads
- verified the pull/sync did not reapply the new PDF route work into this upload-focused change set

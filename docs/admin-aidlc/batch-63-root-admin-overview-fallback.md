# Batch 63: Root Admin Overview Fallback

## Intent

- Keep the shared root entry (`/`) from dropping authenticated admin users into `사업장/현장` by default.
- Align both post-login admin landing and later root revisits with the overview dashboard.

## Admin Contract Impact

- `features/home/hooks/useHomeScreenState.ts` now redirects authenticated admin/controller users from `/` to `getAdminSectionHref('overview')`.
- The one-time post-login redirect still wins when a pending redirect exists in session storage.
- Revisiting the shared root after login now lands on `관리 대시보드` instead of `사업장/현장`.

## Deployment Notes

- No API, schema, or environment changes are required.
- Client deployment only.

## Verification

- `npx eslint features/home/hooks/useHomeScreenState.ts`
- `npx tsc --noEmit --pretty false`


# Batch 62: Admin Site Photo Menu Link Alignment

## Intent

- Align the admin side-menu `현장 사진첩` entry with the photo-album action used on the site main screen.
- Keep site-scoped photo album navigation consistent so the same site photo shell opens from both entry points.

## Admin Contract Impact

- `components/admin/AdminMenu.tsx` now routes the site child menu `현장 사진첩` through `buildSitePhotoAlbumHref(siteId)`.
- The side menu no longer opens the admin-wide `section=photos` route for site-scoped photo navigation.
- Admin site main `사진첩` action and the side menu `현장 사진첩` now land on the same `/sites/[siteId]/photos` screen.
- Site photo album active-state resolution remains unchanged.

## Deployment Notes

- No API, schema, or environment changes are required.
- Client deployment only.

## Verification

- `npx eslint components/admin/AdminMenu.tsx`
- `npx tsc --noEmit --pretty false`


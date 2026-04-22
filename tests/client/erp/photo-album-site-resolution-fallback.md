# ERP Proof Companion: Photo Album Site Resolution Fallback

## Covered Source Areas

- `features/photos/components/SitePhotoAlbumScreen.tsx`
- `features/mobile/components/MobileSitePhotoAlbumScreen.tsx`

## Proof Notes

- photo album screens now resolve the site through `useResolvedSiteRoute(siteKey)` instead of
  relying only on the local `sites` cache
- while site resolution is still in flight, both web and mobile screens keep the loading state
  instead of showing the missing-site empty state too early
- once the site resolves, the existing `PhotoAlbumPanel` empty-state path still handles
  zero-photo sites without blocking entry

## Checks

- `npx eslint features/photos/components/SitePhotoAlbumScreen.tsx features/mobile/components/MobileSitePhotoAlbumScreen.tsx`

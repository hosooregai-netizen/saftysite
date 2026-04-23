# Batch 58 - Photo Album Site Bootstrap Limit

## Scope

- reduce the admin photo album first-load site directory bootstrap
- keep mailbox directory loading unchanged because mailbox report composition still needs the full headquarters/site directory

## What Changed

- added a `photo-sites` dashboard core-data scope for the admin photo album
- limited the photo album bootstrap site options to the first 100 active sites
- preserved the existing full `sites` and `mailbox` scopes for screens that still need all directory pages

## Why

- the photo album list already loads 20 rows at a time, but the admin photo section still fetched every site page before the screen settled
- limiting the initial filter/upload options removes repeated `/sites?active_only=true...` page requests from the first paint path

## Validation

- `npx eslint --ignore-pattern 'reverse-rebuild/**' features/admin/hooks/useAdminDashboardDataLoaders.ts features/admin/hooks/useAdminDashboardRouting.ts`
- `npx tsc --noEmit --pretty false`
- Playwright live smoke against `http://127.0.0.1:3211/admin?section=photos` confirmed a single site bootstrap request with `limit=100&offset=0`
- `curl` against `/api/photos?all=false&source=album_upload&limit=20&offset=0&sort_by=capturedAt&sort_dir=desc` returned 20 rows in 0.18s locally

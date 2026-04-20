# Admin AIDLC Batch 40: Photo Album Mutation Capability Fallback

## Why

- some connected Safety API deployments still expose photo album reads before they expose bulk round-change or delete mutations
- the admin photo album UI should not offer destructive actions that the current upstream cannot handle
- the Next route should return a clear unsupported response instead of surfacing a raw upstream 405

## What changed

- `server/admin/safetyApiServer.ts` now reads the upstream OpenAPI document and caches whether `/photo-assets` supports `PATCH` and `DELETE`
- `server/photos/service.ts` and `server/photos/album.ts` now return photo album mutation capabilities with each list response
- `types/photos.ts` adds the shared mutation capability shape
- `features/photos/components/PhotoAlbumPanel.tsx` now disables unsupported bulk actions and shows a capability notice
- `app/api/photos/route.ts` translates upstream `405` responses into clearer `501` responses for round-change and delete requests
- `scripts/verifyAidlcPush.mjs` maps newly added guarded files to the correct smoke features
- `tests/client/erp/mobile-site-home.spec.ts` now triggers the quarterly link via the anchor directly so the smoke stays stable under sticky mobile chrome

## Validation

- `npx eslint app/api/photos/route.ts features/photos/components/PhotoAlbumPanel.tsx scripts/verifyAidlcPush.mjs server/admin/safetyApiServer.ts server/photos/album.ts server/photos/service.ts tests/client/erp/mobile-site-home.spec.ts types/photos.ts`
- `npx tsc --noEmit --pretty false`
- `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3100 npm run verify:aidlc:push`

# Admin Photo Album Mutation Capabilities Proof

## Scope

- admin photo album list responses include capability metadata for delete and round-change actions
- unsupported upstream mutations are surfaced to the client as explicit fallback messages instead of opaque server errors
- push-time smoke selection covers the newly added guarded files, and the mobile home smoke remains stable

## Verification

- `npx eslint app/api/photos/route.ts features/photos/components/PhotoAlbumPanel.tsx scripts/verifyAidlcPush.mjs server/admin/safetyApiServer.ts server/photos/album.ts server/photos/service.ts tests/client/erp/mobile-site-home.spec.ts types/photos.ts`
- `npx tsc --noEmit --pretty false`
- `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3100 npm run verify:aidlc:push`

## Expected outcome

- photo album bulk round-change and delete controls disable cleanly when the upstream capability is unavailable
- unsupported mutation attempts return actionable fallback copy
- the guarded push diff no longer fails on missing smoke mappings

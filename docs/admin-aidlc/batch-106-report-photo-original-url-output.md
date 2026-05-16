# Admin AIDLC Batch 106: Report Photo Original URL Output

## Scope

- Preserve thumbnail-first album previews while exposing original image URLs in mapped photo album items.
- Keep existing backend photo asset fields (`original_path`, `thumbnail_path`) as the source of truth without a schema change.
- Ensure admin/server photo mappers do not turn missing original paths into unusable upstream URLs.

## Contract Notes

- `previewUrl` remains thumbnail-first for list and grid UI rendering.
- `originalUrl` maps directly from `original_path`.
- `thumbnailUrl` maps from `thumbnail_path || original_path`.
- Legacy items keep a single normalized source URL for all three fields.

## Verification

- `npx tsx --test lib/photos/apiClient.test.ts`
- `npx tsx --test app/api/photos/route.test.ts app/api/photos/upload/route.test.ts`
- `npx tsx --test app/api/photos/download/route.test.ts`
- `npx tsx --test server/photos/albumSort.test.ts`
- `npx eslint server/admin/upstreamMappers.ts server/photos/album.ts lib/photos/apiClient.ts types/photos.ts`

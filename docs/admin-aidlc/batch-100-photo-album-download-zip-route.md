# Admin AIDLC Batch 100: Photo Album Download ZIP Route

## Scope

- `app/api/photos/download/route.ts`
- `app/api/photos/download/routeHandlers.ts`
- `app/api/photos/download/route.test.ts`
- `server/admin/safetyApiServer.ts`
- `server/admin/safetyApiServer.test.ts`
- `tests/client/admin/admin-photo-album-download-zip-route.proof.md`

## Change

- Split the photo album download route into injectable handlers so the single-file and multi-file paths can be tested directly.
- Kept single selected photos on the original binary response path.
- Built multiple selected album-upload photos into a ZIP response with stable, unique entry names.
- Added item context to ZIP source download failures so upstream timeout or access errors identify the failed photo.
- Treated `/photo-assets/{asset_id}/download` as a file-download request timeout while keeping photo asset list reads on the default timeout.

## Validation

- `npx tsx --test app/api/photos/download/route.test.ts server/admin/safetyApiServer.test.ts`
- `npm run verify:aidlc`

## Notes

- The current ZIP implementation buffers the generated archive in the Next.js route response. Large production photo batches may still need a streaming or direct-source download path for strict Vercel response-size limits.

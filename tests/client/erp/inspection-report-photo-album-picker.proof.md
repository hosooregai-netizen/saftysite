# Inspection Report Photo Album Picker Proof

## Scope

- Desktop technical-guidance image slots open a source choice modal before file upload.
- Report image slots can link an existing photo album asset URL without creating a new upload.
- Mobile photo album selection reuses the shared picker while keeping camera/gallery entry points.
- Doc11 education material stays file-upload only.

## Validation

- `npx tsx --test lib/photos/apiClient.test.ts`
- `npx tsx --test app/api/photos/route.test.ts`
- `npx tsx --test app/api/photos/upload/route.test.ts`
- `npx tsx --test server/photos/albumSort.test.ts`
- `npx tsx --test server/photos/album.test.ts`
- `npx tsc --noEmit`

## Notes

- Album URL linking stores `originalUrl || previewUrl`.
- AI-assisted slots save the selected URL first and treat `assetUrlToFile` failures as non-blocking AI fallback failures.

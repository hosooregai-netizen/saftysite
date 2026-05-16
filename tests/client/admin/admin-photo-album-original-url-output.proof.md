# Admin Proof: Photo Album Original URL Output

## Guarded Behavior

- Uploaded photo asset responses include `originalUrl`, `previewUrl`, and `thumbnailUrl`.
- Admin/server mappers preserve `originalUrl` from the backend original asset path.
- Thumbnail URLs remain available for preview-oriented UI surfaces.

## Evidence

- `lib/photos/apiClient.test.ts` checks original and thumbnail URL separation.
- `app/api/photos/upload/route.test.ts` checks upload route payload fields.
- `server/photos/albumSort.test.ts` and `app/api/photos/download/route.test.ts` keep album fixtures aligned with the expanded item contract.

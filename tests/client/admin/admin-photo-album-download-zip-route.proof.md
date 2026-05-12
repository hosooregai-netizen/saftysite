# Admin Photo Album Download ZIP Route Proof

## Scope

- selected photo album uploads continue to download as the original binary when only one item is selected
- selected photo album uploads download as a ZIP when multiple items are selected
- unresolved selections fail before any source download starts
- failed ZIP item downloads include the asset id, filename, and upstream error context
- photo asset upload/download server timeouts distinguish long-running upload/download paths from ordinary list reads

## Verification

- `npx tsx --test app/api/photos/download/route.test.ts server/admin/safetyApiServer.test.ts`
- `npm run verify:aidlc`

## Expected outcome

- photo album batch download returns `application/zip` with the selected files inside
- single-photo download still returns the source content type and original filename
- timeout handling gives photo asset downloads enough time without slowing ordinary photo asset list requests

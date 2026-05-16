# Inspection Document 12 Activity Layout Proof

- Scope: document 12 activity title/image/content UI and HWPX/PDF binding alignment.
- Data proof: document 12 keeps two visible activity records with `activityTitle`, `photoUrl`, and `content`; legacy `photoUrl2` payload is split into the second activity without moving content into title cells.
- Output proof: HWPX generation binds activity 1/2 titles to the top row, activity 1/2 images to the image row, and activity 1/2 contents to the bottom row for both inspection template variants.
- Legacy proof: `activityType` is used only as a bottom-content fallback for old payloads, not as an output title fallback.

Verification:

- `npx tsc --noEmit --pretty false`
- `node --import tsx --test server/documents/inspection/hwpx.test.ts`
- `node --import tsx --test lib/safetyApiMappers/reportsPayload.test.ts`
- `node --import tsx --test server/documents/inspection/standardHwpx.test.ts`
- JSON parse check for inspection template contract and annotation map

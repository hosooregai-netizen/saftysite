# ERP Proof: Inspection Report Original Photo Output

## Guarded Behavior

- Inspection report fields store `originalUrl || previewUrl` after photo album selection.
- Upload promotion stores `uploaded.originalUrl || uploaded.previewUrl`.
- Mobile preview paths can continue using thumbnails where a file preview or AI/matching helper needs a lightweight source.

## Evidence

- Static review covers desktop upload handling, autosave upload promotion, and mobile album selection paths.
- `server/documents/inspection/hwpx.test.ts` verifies doc5 chart assets are embedded as PNG BinData and not left as inline data URLs.
- The lint target for inspection/mobile report paths completed without errors.

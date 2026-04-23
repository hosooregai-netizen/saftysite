# Admin Original PDF Download Timeout Proof

## Scope

- large admin original-PDF requests should not be constrained by the ordinary 15s safety API timeout
- report rows that already carry a direct original-PDF archive/download path should read that asset before falling back to the backend `original-pdf` endpoint
- large upload/download proxy traffic should share the longer file-transfer timeout budget

## Validation

- `pnpm exec tsx --test server/admin/safetyApiServer.test.ts server/admin/originalPdfDocument.test.ts lib/safetyApi/proxy.test.ts`

## Notes

- This proof targets the admin/server-side download contract for original PDFs, not the mailbox send-size fallback logic.

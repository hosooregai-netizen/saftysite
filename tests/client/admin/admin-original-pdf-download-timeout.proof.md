# Admin Original PDF Download Timeout Proof

## Scope

- large admin original-PDF requests should not be constrained by the ordinary 15s safety API timeout
- report rows that already carry a direct original-PDF archive/download path should read that asset before falling back to the backend `original-pdf` endpoint
- large upload/download proxy traffic should share the longer file-transfer timeout budget
- original-PDF descriptor probes for mail/report flows should fail within a bounded timeout budget instead of waiting for the full serverless function timeout
- descriptor timeouts should preserve the original-PDF attachment contract when the later document fetch is still the correct path
- all-upstream original-PDF timeouts should surface as `504`, not `404`

## Validation

- `npx tsx --test server/admin/safetyApiServer.test.ts server/admin/originalPdfDocument.test.ts server/mail/reportAttachment.test.ts lib/safetyApi/proxy.test.ts`
- `npx eslint server/admin/originalPdfDocument.ts server/admin/originalPdfDocument.test.ts server/mail/reportAttachment.ts server/mail/reportAttachment.test.ts`

## Notes

- This proof targets the admin/server-side original-PDF contract that mailbox report send and original-PDF download routes both depend on.

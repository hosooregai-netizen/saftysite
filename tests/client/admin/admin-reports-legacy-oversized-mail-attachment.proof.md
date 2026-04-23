# Admin Reports Legacy Oversized Mail Attachment Proof

## Scope

- manifest-backed legacy reports with oversized original PDFs should keep resolving as original-PDF attachments instead of falling back to generated PDFs
- original-PDF descriptor lookup should survive upstream asset endpoints that only allow `GET`
- canonical admin mailbox report hydration should keep preferring the legacy/original row when current/generated duplicates share the same title

## Validation

- `pnpm exec tsx --test server/admin/originalPdfDocument.test.ts server/mail/reportAttachment.test.ts app/api/mail/send-report/route.test.ts`
- `pnpm exec eslint server/admin/originalPdfDocument.ts server/admin/originalPdfDocument.test.ts`
- `pnpm exec tsc --noEmit --pretty false`
- `npm run build`

## Runtime Probe

- direct `buildMailReportAttachment(...)` probes on `legacy:technical_guidance:427520` and `legacy:technical_guidance:440160` now return `download_url` attachments with `size_bytes` of `71241257` and `24504008`
- because those payloads stay on the original-PDF path again, `/api/mail/send-report` can re-enter the oversized-link branch for new sends instead of attaching the generated 144KB PDF

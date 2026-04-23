# Batch 69: Legacy Oversized Mail Attachment Descriptor Fallback

## Intent

- Keep legacy mail attachments on the original-PDF path instead of silently falling back to generated 144KB PDFs.
- Recover original-PDF size metadata even when the upstream asset endpoint does not support `HEAD`.
- Keep mailbox admin report selection hydrated from canonical `/api/admin/reports` rows so duplicate current/legacy titles prefer the attachable legacy row.

## Admin Contract Impact

- `server/admin/originalPdfDocument.ts` now retries original-PDF descriptor discovery with a ranged `GET` when an upstream asset URL rejects `HEAD`.
- Legacy `/uploads/content-items/...` archive paths now also generate `/api/v1/content-items/assets/...` candidates using the actual UUID-prefixed asset filename from `archivePath`.
- `buildMailReportAttachment(...)` now resolves `legacy:technical_guidance:427520` and `legacy:technical_guidance:440160` as oversized original PDFs, which lets `/api/mail/send-report` switch them to authenticated download-link delivery instead of attaching a generated PDF.
- Mailbox admin report hydration stays on canonical `/api/admin/reports` rows so stale preload data does not reselect the current/generated duplicate when a legacy/original row exists.

## Deployment Notes

- No environment-variable changes are required.
- Already-sent mails remain unchanged; the corrected oversized-link behavior applies to newly sent messages after deploy/restart.

## Verification

- `pnpm exec tsx --test server/admin/originalPdfDocument.test.ts server/mail/reportAttachment.test.ts app/api/mail/send-report/route.test.ts`
- `pnpm exec eslint server/admin/originalPdfDocument.ts server/admin/originalPdfDocument.test.ts`
- `pnpm exec tsc --noEmit --pretty false`
- `npm run build`

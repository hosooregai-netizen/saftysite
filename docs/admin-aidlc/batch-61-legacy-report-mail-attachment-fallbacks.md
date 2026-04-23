# Batch 61: Legacy Report Mail Attachment Fallbacks

## Intent

- Keep legacy report selection aligned across admin reports and mailbox send flows.
- Stop showing legacy reports in the mailbox picker when no attachable PDF exists.
- Stop showing in-progress draft/current reports in the mailbox picker when they are not yet attachable.
- Avoid slow or failing oversized report sends by swapping large original PDFs to download links.

## Admin Contract Impact

- `/api/admin/reports` can now filter mailbox selections down to report rows that are actually attachable.
- Mailbox attachment eligibility now also considers report workflow state so draft/in-progress rows do not appear as sendable report attachments.
- Legacy site/report alignment reuses a shared site-name normalization helper so older labels still match live sites.
- `/api/admin/reports/[reportKey]/original-pdf` resolves original-PDF metadata through a shared descriptor helper instead of duplicating path logic.
- Mail attachment preparation records original-PDF size metadata without downloading the full file body first.
- `/api/mail/send-report` now replaces oversized original-PDF attachments with a download link before calling the upstream mail API when the total attachment payload would exceed 20MB.
- If the upstream mail API still rejects the payload for size, the route keeps the existing retry path that removes the report attachment and appends the download link to the message body.

## Deployment Notes

- This change still depends on the paired `safety-server` URL-attachment support already deployed for `/mail/send`.
- Large original PDFs now rely on the existing authenticated `/api/admin/reports/[reportKey]/original-pdf` download path instead of base64 payload delivery.
- No new environment variables are required.

## Verification

- `pnpm exec tsx --test app/api/mail/send-report/route.test.ts server/mail/reportAttachment.test.ts server/admin/originalPdfDocument.test.ts`
- `pnpm exec eslint app/api/mail/send-report/route.ts app/api/mail/send-report/route.test.ts server/mail/reportAttachment.ts server/mail/reportAttachment.test.ts server/mail/reportAttachmentCache.ts server/admin/originalPdfDocument.ts server/admin/originalPdfDocument.test.ts scripts/verifyAidlcPush.mjs`
- `pnpm exec tsc --noEmit --pretty false`

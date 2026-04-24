# Batch 69: Legacy Oversized Mail Attachment Descriptor Fallback

## Intent

- Keep legacy mail attachments on the original-PDF path instead of silently falling back to generated 144KB PDFs.
- Recover original-PDF size metadata even when the upstream asset endpoint does not support `HEAD`.
- Keep mailbox admin report selection hydrated from canonical `/api/admin/reports` rows so duplicate current/legacy titles prefer the attachable legacy row.

## Admin Contract Impact

- `server/admin/originalPdfDocument.ts` now retries original-PDF descriptor discovery with a ranged `GET` when an upstream asset URL rejects `HEAD`.
- Upstream original-PDF descriptor probes now run with bounded per-attempt and total timeout budgets, so `/api/mail/prepare-report` fails fast instead of hanging until the platform 300s function timeout.
- Upstream original-PDF document reads now surface a `504` timeout when every direct asset lookup stalls, instead of collapsing into a misleading `404`.
- Legacy `/uploads/content-items/...` archive paths now also generate `/api/v1/content-items/assets/...` candidates using the actual UUID-prefixed asset filename from `archivePath`.
- `buildMailReportAttachment(...)` now resolves `legacy:technical_guidance:427520` and `legacy:technical_guidance:440160` as oversized original PDFs, which lets `/api/mail/send-report` switch them to authenticated download-link delivery instead of attaching a generated PDF.
- When descriptor lookup times out but the original-PDF route is still the correct contract, `buildMailReportAttachment(...)` now keeps the authenticated `original-pdf` download attachment and omits `size_bytes` so the send path can continue on the real fetch step.
- Mailbox admin report hydration stays on canonical `/api/admin/reports` rows so stale preload data does not reselect the current/generated duplicate when a legacy/original row exists.

## Deployment Notes

- No environment-variable changes are required.
- Already-sent mails remain unchanged; the corrected oversized-link behavior applies to newly sent messages after deploy/restart.

## Verification

- `npx tsx --test server/admin/originalPdfDocument.test.ts server/mail/reportAttachment.test.ts app/api/mail/send-report/route.test.ts app/api/mail/send/route.test.ts`
- `npx eslint server/admin/originalPdfDocument.ts server/admin/originalPdfDocument.test.ts server/mail/reportAttachment.ts server/mail/reportAttachment.test.ts app/api/mail/send/route.ts app/api/mail/send/route.test.ts features/mailbox/components/mailboxComposeHelpers.ts features/mailbox/components/useMailboxSendAction.ts lib/mail/apiClient.ts types/mail.ts`
- `npx tsc --noEmit --pretty false`

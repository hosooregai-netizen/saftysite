# Mailbox Report Attachment Link Fallback Proof

## Scope

- mailbox report selection should hide legacy rows that do not have an attachable original PDF
- mailbox report selection should hide draft/in-progress report rows that are not yet attachable
- selecting a legacy report with an original PDF should prepare an authenticated download-based attachment payload without reading the full PDF body first
- report sends should replace oversized original-PDF attachments with a download link instead of failing at the 20MB mail limit
- generic mailbox file attachments should upload to HTTPS content assets instead of pushing raw base64 blobs through `/api/mail/send`
- `/api/mail/send` should materialize uploaded attachment references server-side and reject oversized totals before the upstream mail provider call

## Validation

- `npx tsx --test server/mail/reportAttachment.test.ts app/api/mail/send-report/route.test.ts app/api/mail/send/route.test.ts`
- `npx eslint app/api/mail/send/route.ts app/api/mail/send/route.test.ts features/mailbox/components/mailboxComposeHelpers.ts features/mailbox/components/useMailboxSendAction.ts lib/mail/apiClient.ts types/mail.ts`

## Notes

- The ERP mailbox smoke coverage stays on the report-capable flows already mapped by `verify:aidlc:push`.
- Generated PDFs without a download URL still use the existing attachment path; the new HTTPS upload/materialize flow only replaces browser-side base64 attachment sends.

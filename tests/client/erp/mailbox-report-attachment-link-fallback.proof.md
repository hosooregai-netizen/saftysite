# Mailbox Report Attachment Link Fallback Proof

## Scope

- mailbox report selection should hide legacy rows that do not have an attachable original PDF
- mailbox report selection should hide draft/in-progress report rows that are not yet attachable
- selecting a legacy report with an original PDF should prepare an authenticated download-based attachment payload without reading the full PDF body first
- report sends should replace oversized original-PDF attachments with a download link instead of failing at the 20MB mail limit

## Validation

- `pnpm exec tsx --test features/mailbox/components/mailboxReportPickerHelpers.test.ts server/mail/reportAttachment.test.ts app/api/mail/send-report/route.test.ts`
- `pnpm exec tsx tests/client/runSmoke.ts quarterly-report bad-workplace-report`

## Notes

- The ERP mailbox smoke coverage stays on the report-capable flows already mapped by `verify:aidlc:push`.
- Generated PDFs without a download URL still use the existing attachment path; this proof is specifically for original-PDF legacy reports.

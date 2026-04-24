# Batch 72: Current Report Mail Attachments

## Intent

- Restore mailbox attachment eligibility for current ERP reports that only have generated PDFs.
- Keep legacy report restrictions unchanged when no original PDF exists.
- Preserve the canonical admin report merge behavior that prefers attachable legacy rows when current and legacy reports describe the same visit.

## Admin Contract Impact

- `/api/admin/reports?mail_attachable_only=true` now includes non-legacy draft/current rows again when they can be attached through the generated PDF routes.
- Legacy rows without `originalPdfAvailable` remain excluded from mailbox attachment candidate lists.
- The admin reports route now reads mailbox attachment filters from a shared helper module so the route and route tests stay aligned without exporting extra Next route symbols.

## Deployment Notes

- No new environment variables or upstream API changes are required.
- Current ERP reports continue to use the existing generated PDF endpoints during mail attachment preparation.

## Verification

- `npx tsx --test features/mailbox/components/mailboxReportPickerHelpers.test.ts app/api/admin/reports/route.test.ts server/mail/reportAttachment.test.ts`
- `npx tsc --noEmit --pretty false`
- `npm run aidlc:audit:admin`

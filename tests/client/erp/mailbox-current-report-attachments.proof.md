# ERP Mailbox Current Report Attachments Proof

## Scope

- ERP mailbox report options should keep current non-legacy draft reports attachable when they rely on generated PDFs
- legacy reports without original PDFs should still remain blocked in the shared mailbox picker helpers
- shared mailbox option merging should keep the existing canonical preference for attachable legacy rows

## Validation

- `npx tsx --test features/mailbox/components/mailboxReportPickerHelpers.test.ts`
- `npx tsc --noEmit --pretty false`

## Notes

- This proof covers the ERP-facing mailbox picker helper contract; the paired admin proof documents the `/api/admin/reports` filter behavior.

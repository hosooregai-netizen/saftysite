# Admin Current Report Mail Attachments Proof

## Scope

- non-legacy current reports should stay attachable in mailbox pickers even when they are still draft rows without an original PDF
- legacy rows without original PDFs should remain excluded from admin mailbox attachment candidates
- generated inspection PDF routes should remain the active send path for current technical guidance report attachments

## Validation

- `npx tsx --test features/mailbox/components/mailboxReportPickerHelpers.test.ts app/api/admin/reports/route.test.ts server/mail/reportAttachment.test.ts`
- `npx tsc --noEmit --pretty false`

## Notes

- This proof covers the shared admin report eligibility contract that feeds mailbox selection and send preparation.
- Canonical current/legacy merge preference remains unchanged; this batch only restores attachability for ERP-native current reports.

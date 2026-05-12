# Batch 92: Mail Report Autocomplete Template

## Scope

- Mailbox report templates used by admin and worker report-mail composition.
- Admin report row metadata passed into mailbox report options.
- Legacy report metadata used for mail subject/body round labels.

## What Changed

- Updated the default and guidance report mail templates to the Korean Total Safety guidance-result format.
- Passed assignee name, guidance round, and contract round into mailbox report options.
- Preserved current and legacy admin report row round metadata so the mail subject/body can be filled automatically.

## Verification

- `features/mailbox/components/mailboxReportTemplates.test.ts`
- `features/mailbox/components/mailboxReportPickerHelpers.test.ts`
- `tests/client/admin/mail-report-autocomplete-template.proof.md`
- `tests/client/erp/mail-report-autocomplete-template.proof.md`

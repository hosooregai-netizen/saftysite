# ERP Proof: Mail Report Autocomplete Template

## Covered Behavior

- Worker mailbox report options include assignee, guidance round, and contract round metadata.
- Report compose state uses the selected report template to auto-fill the guidance-result subject and body.
- Report compose UI no longer exposes a template selector; selecting a report is the only report-template action.
- The template keeps the report attachment flow unchanged while replacing only the auto-composed mail text.

## Verification

- `npx tsx --test features/mailbox/components/mailboxReportTemplates.test.ts features/mailbox/components/mailboxReportPickerHelpers.test.ts`
- `npx tsc --noEmit --pretty false` is currently blocked by existing unstaged `server/documents/inspection/hwpx.test.ts` fixture type errors unrelated to this batch.

# Admin Proof: Mail Report Autocomplete Template

## Covered Behavior

- Admin report rows carry assignee, guidance round, and contract round metadata into mailbox report options.
- Current and legacy report rows keep enough metadata to render the requested report-mail subject and body.
- The selected report mail template renders the guidance-result subject and body with the expected static contact block.

## Verification

- `npx tsx --test features/mailbox/components/mailboxReportTemplates.test.ts features/mailbox/components/mailboxReportPickerHelpers.test.ts`
- `npx tsc --noEmit --pretty false` is currently blocked by existing unstaged `server/documents/inspection/hwpx.test.ts` fixture type errors unrelated to this batch.

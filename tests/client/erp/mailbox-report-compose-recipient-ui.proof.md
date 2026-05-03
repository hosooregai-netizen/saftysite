# ERP Proof: Mailbox Report Compose Recipient UI

## Covered Behavior

- Report compose hydrates selected report and picker options with site detail when the primary site manager email is missing from the list row.
- The selected report state detects recipient email changes so the compose recipients can be auto-filled from the matched site manager email.
- The report compose support area no longer shows explanatory helper text, and report/file actions are presented together at the top of the compose flow.
- The guidance report body preserves blank lines in rendered HTML.

## Verification

- `npx tsx --test features\mailbox\components\mailboxReportTemplates.test.ts features\mailbox\components\mailboxReportPickerHelpers.test.ts features\mailbox\components\adminMailboxReportData.test.ts`

# Mailbox Report PDF Legacy Selection Proof

## Scenario

- Worker/admin mailbox compose uses shared mailbox UI components.
- Report selection should preserve generated report sends and allow legacy original PDF sends through the same compose flow.
- Large PDF work should move away from the browser where possible.

## Expected Result

- Report selection metadata includes original PDF availability.
- Legacy report keys are treated as original PDF attachments.
- Generated report PDFs can be prepared by the server cache warm route.
- Sending a report delegates report PDF attachment creation to `/api/mail/send-report`.

## Automated Coverage

- `features/mailbox/components/mailboxReportPickerHelpers.test.ts`
- `server/mail/reportAttachment.test.ts`
- `lib/admin/originalPdfClient.test.ts`

## Commands Run

- `npx tsx --test features/mailbox/components/mailboxReportPickerHelpers.test.ts server/admin/legacyAdminReportsSnapshot.test.ts server/admin/legacyReportAlignment.test.ts lib/admin/originalPdfClient.test.ts server/mail/reportAttachment.test.ts`
- `npx eslint app/api/mail/prepare-report/route.ts app/api/mail/send-report/route.ts server/mail/reportAttachment.ts server/mail/reportAttachment.test.ts features/mailbox/components/mailboxReportPickerHelpers.ts features/mailbox/components/mailboxReportPickerHelpers.test.ts features/mailbox/components/useMailboxReportState.ts features/mailbox/components/useMailboxComposeUiActions.ts features/mailbox/components/useMailboxSendAction.ts server/admin/legacyAdminReportsSnapshot.ts server/admin/legacyAdminReportsSnapshot.test.ts server/admin/legacyReportAlignment.ts lib/mail/apiClient.ts`
- `npx tsc --noEmit`

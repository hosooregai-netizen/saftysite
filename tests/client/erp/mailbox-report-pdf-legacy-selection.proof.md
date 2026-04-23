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
- Encoded legacy report keys are decoded before original PDF manifest lookup.
- The report picker loads admin options in 20-row pages instead of preloading up to 1000 rows.
- Search or site-filter changes reset the picker to the first page and fetch the new page from the server.
- Mail attachments use the selected report title as the outgoing PDF filename for both legacy and generated reports.
- Admin mailbox sends can forward the current user's display name alongside the shared mailbox account.

## Automated Coverage

- `features/mailbox/components/mailboxReportPickerHelpers.test.ts`
- `server/mail/reportAttachment.test.ts`
- `server/admin/originalPdfRouteHelpers.test.ts`
- `lib/admin/originalPdfClient.test.ts`

## Commands Run

- `npx tsx --test features/mailbox/components/mailboxReportPickerHelpers.test.ts server/admin/legacyAdminReportsSnapshot.test.ts server/admin/legacyReportAlignment.test.ts server/admin/originalPdfRouteHelpers.test.ts lib/admin/originalPdfClient.test.ts server/mail/reportAttachment.test.ts`
- `npx eslint app/api/mail/send-report/route.ts server/mail/reportAttachment.ts server/mail/reportAttachment.test.ts lib/mail/apiClient.ts features/mailbox/components/useMailboxSendAction.ts features/mailbox/components/useMailboxPanelActions.ts features/mailbox/components/MailboxPanel.tsx features/admin/components/AdminDashboardSectionContent.tsx features/admin/sections/mailbox/MailboxSection.tsx`
- `npx tsc --noEmit`

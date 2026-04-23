# Admin Mailbox Report PDF Legacy Selection Proof

## Scenario

- Admin mailbox compose opens the report picker with a selected site.
- Legacy technical-guidance rows exist for that site, but the legacy data may use a different company suffix or no live `siteId`.
- The selected legacy report should be available as an original PDF attachment without forcing the browser to generate or base64-encode the PDF.

## Expected Result

- Legacy rows for sites such as `하왕십리동 890-93 다세대 신축공사` and `한남동 729-9 대수선공사` are matched to live sites by normalized company/site names.
- The report picker can show matching legacy reports after a site is selected.
- Sending a selected report calls the server-side report attachment route.
- Legacy/original reports use `/api/admin/reports/[reportKey]/original-pdf`; generated reports use the appropriate document PDF route and cache warm path.
- Encoded legacy keys such as `legacy%3Atechnical_guidance%3A435681` resolve to the same original PDF manifest entry as decoded keys.
- Mail attachments use the visible report title as the filename instead of raw legacy/generated keys.
- Shared mailbox sends can stamp the current admin user's display name instead of only the shared mailbox label.

## Automated Coverage

- `features/mailbox/components/mailboxReportPickerHelpers.test.ts`
- `server/admin/legacyAdminReportsSnapshot.test.ts`
- `server/admin/legacyReportAlignment.test.ts`
- `server/admin/originalPdfRouteHelpers.test.ts`
- `server/mail/reportAttachment.test.ts`
- `lib/admin/originalPdfClient.test.ts`

## Commands Run

- `npx tsx --test features/mailbox/components/mailboxReportPickerHelpers.test.ts server/admin/legacyAdminReportsSnapshot.test.ts server/admin/legacyReportAlignment.test.ts server/admin/originalPdfRouteHelpers.test.ts lib/admin/originalPdfClient.test.ts server/mail/reportAttachment.test.ts`
- `npx eslint app/api/admin/reports/[reportKey]/original-pdf/route.ts app/api/mail/prepare-report/route.ts app/api/mail/send-report/route.ts server/mail/reportAttachment.ts server/mail/reportAttachment.test.ts features/mailbox/components/mailboxReportPickerHelpers.ts features/mailbox/components/mailboxReportPickerHelpers.test.ts features/mailbox/components/useMailboxReportState.ts features/mailbox/components/useMailboxComposeUiActions.ts features/mailbox/components/useMailboxSendAction.ts features/mailbox/components/useMailboxPanelActions.ts features/mailbox/components/MailboxPanel.tsx features/admin/components/AdminDashboardSectionContent.tsx features/admin/sections/mailbox/MailboxSection.tsx server/admin/legacyAdminReportsSnapshot.ts server/admin/legacyAdminReportsSnapshot.test.ts server/admin/legacyReportAlignment.ts server/admin/originalPdfRouteHelpers.ts server/admin/originalPdfRouteHelpers.test.ts lib/mail/apiClient.ts`
- `npx tsc --noEmit`

# Batch 60: Mailbox Report PDF Legacy Selection

## Intent

- Allow the admin mailbox report picker to select legacy technical-guidance PDF reports for live sites.
- Avoid client-side PDF download/base64 work when sending selected reports by preparing the report attachment on the server.
- Preserve existing generated PDF behavior while using registered original PDFs for legacy reports.

## Admin Contract Impact

- `/api/admin/reports` legacy row alignment now tolerates company suffix differences such as `(주)` and `주식회사`.
- Legacy rows can attach to a live site by unique site-name fallback when legacy memo IDs are missing.
- The mailbox report picker reloads admin report options for the selected site and merges site-name fallback results.
- `/api/mail/send-report` builds the selected report PDF attachment server-side before forwarding to `/mail/send`.
- `/api/mail/prepare-report` warms generated report PDF cache after selection so send-time work is shorter.
- `/api/admin/reports/[reportKey]/original-pdf` normalizes encoded legacy report keys before manifest lookup.

## Deployment Notes

- No safety-server restart is required for this client/Next route change.
- Vercel deployment must include the new server routes and legacy matching helpers.
- Existing asset/upload/PDF environment variables are unchanged.

## Verification

- `npx tsx --test features/mailbox/components/mailboxReportPickerHelpers.test.ts server/admin/legacyAdminReportsSnapshot.test.ts server/admin/legacyReportAlignment.test.ts server/admin/originalPdfRouteHelpers.test.ts lib/admin/originalPdfClient.test.ts server/mail/reportAttachment.test.ts`
- `npx eslint app/api/admin/reports/[reportKey]/original-pdf/route.ts app/api/mail/prepare-report/route.ts app/api/mail/send-report/route.ts server/mail/reportAttachment.ts server/mail/reportAttachment.test.ts features/mailbox/components/mailboxReportPickerHelpers.ts features/mailbox/components/mailboxReportPickerHelpers.test.ts features/mailbox/components/useMailboxReportState.ts features/mailbox/components/useMailboxComposeUiActions.ts features/mailbox/components/useMailboxSendAction.ts server/admin/legacyAdminReportsSnapshot.ts server/admin/legacyAdminReportsSnapshot.test.ts server/admin/legacyReportAlignment.ts server/admin/originalPdfRouteHelpers.ts server/admin/originalPdfRouteHelpers.test.ts lib/mail/apiClient.ts`
- `npx tsc --noEmit`

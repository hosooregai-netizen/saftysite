# Batch 71: Direct Report PDF Mail Path

## What changed

- Passed `originalPdfDownloadPath` from the mailbox report picker through `prepare-report` and `send-report`.
- Let mail attachment preparation reuse that direct PDF path instead of refetching report metadata when the path already points to the upstream asset.
- Changed legacy admin report rows to expose manifest-backed `/uploads/content-items/...` paths instead of falling back to `/api/admin/reports/.../original-pdf`.

## Why

- Low-size legacy report mail sends were still spending time rediscovering the original PDF location even when the admin report list already knew that location.
- The previous fallback path kept `prepare-report` hot only when the server had to rediscover the same asset again.

## Result

- On April 24, 2026, the local app at `http://127.0.0.1:3211` returned `originalPdfDownloadPath: /uploads/content-items/3f2d8f9599124d768b3f61c2065108d2-legacy-admin-report-2025-04-28-394606.pdf` for `legacy:technical_guidance:394606`.
- With that direct path flowing through the mail route:
  - `prepare-report`: `40424ms -> 67ms`
  - `send-report`: `5655ms -> 4198ms`
  - sent mailbox visibility: `539ms -> 399ms`

## Validation

- `npx tsx --test server/admin/legacyAdminReportsSnapshot.test.ts server/admin/originalPdfDocument.test.ts server/mail/reportAttachment.test.ts app/api/mail/send-report/route.test.ts`
- `npx tsc --noEmit --pretty false`
- `npx eslint app/api/admin/reports/route.ts server/admin/legacyAdminReportsSnapshot.ts server/admin/legacyAdminReportsSnapshot.test.ts server/admin/originalPdfDocument.ts server/admin/originalPdfDocument.test.ts server/mail/reportAttachment.ts server/mail/reportAttachment.test.ts app/api/mail/send-report/route.ts app/api/mail/prepare-report/route.ts lib/mail/apiClient.ts features/mailbox/components/useMailboxComposeUiActions.ts features/mailbox/components/useMailboxSendAction.ts`

# Admin Reports Legacy Mail Attachment Fallbacks Proof

## Scope

- admin report rows should only surface as mailbox-send candidates when an attachable original PDF exists
- admin report rows that are still draft/in-progress should not surface as mailbox-send candidates until they are actually attachable
- legacy report selection should keep matching the same live site even when older site/headquarter labels differ in formatting
- large legacy original PDFs should still have a usable authenticated download path when they cannot be mailed as direct attachments

## Validation

- `pnpm exec tsx --test server/admin/legacyAdminReportsSnapshot.test.ts server/admin/legacyReportAlignment.test.ts server/admin/originalPdfDocument.test.ts`
- `pnpm exec tsx tests/client/runSmoke.ts admin-reports`

## Notes

- This proof covers the admin-side data contract that feeds the mailbox picker, not the worker/mobile mailbox UI rendering itself.
- Oversized report sends intentionally fall back to download-link delivery instead of trying to push large binary payloads through the upstream mail limit.

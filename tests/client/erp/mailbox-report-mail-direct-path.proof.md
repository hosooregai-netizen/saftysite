# ERP Mailbox Report Mail Direct Path Proof

## Date

- April 24, 2026

## Covered UI path

1. Mailbox report picker resolves a selected legacy report option.
2. The selected option now carries `originalPdfDownloadPath`.
3. `prepareReportMailAttachment(...)` forwards that value before send.
4. `sendReportMail(...)` forwards the same value during actual report mail dispatch.

## Verified outcome

- The local mailbox flow used `originalPdfDownloadPath: /uploads/content-items/3f2d8f9599124d768b3f61c2065108d2-legacy-admin-report-2025-04-28-394606.pdf`.
- The subsequent low-size report send completed with:
  - `prepareElapsedMs: 67`
  - `sendElapsedMs: 4198`
  - `sendStatus: 200`
  - `sentVisibleMs: 399`

## Notes

- This proof covers the ERP-facing mailbox compose path while the admin proof file covers the admin reports source-of-truth path.

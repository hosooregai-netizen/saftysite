# Admin Report Mail Direct Path Proof

## Date

- April 24, 2026

## Flow

1. Logged in to `http://127.0.0.1:3211`.
2. Queried `/api/admin/reports?report_key=legacy:technical_guidance:394606`.
3. Confirmed `originalPdfDownloadPath` resolved to `/uploads/content-items/3f2d8f9599124d768b3f61c2065108d2-legacy-admin-report-2025-04-28-394606.pdf`.
4. Called `/api/mail/prepare-report`.
5. Called `/api/mail/send-report`.
6. Confirmed the sent mailbox thread appeared for the same subject.

## Measured output

```json
{
  "reportKey": "legacy:technical_guidance:394606",
  "originalPdfDownloadPath": "/uploads/content-items/3f2d8f9599124d768b3f61c2065108d2-legacy-admin-report-2025-04-28-394606.pdf",
  "prepareElapsedMs": 67,
  "sendElapsedMs": 4198,
  "sendStatus": 200,
  "sentVisibleMs": 399,
  "threadId": "b344cf15138345ac850fdd7dc4702060"
}
```

## Notes

- The send completed with a real outgoing message response and `deliveredAt` populated.
- This proof uses the same personal NAVER WORKS account and recipient used in the prior mailbox benchmarks.

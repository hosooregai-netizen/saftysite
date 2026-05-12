# Code Map Patch

Step 16은 실제 `apps(3).zip` source tree를 기준으로 code map을 보강한다.

## Route additions

```text
/dashboard
/pricing
```

## Proxy route group

```text
/api/admin/[...path]
/api/mail/[...path]
/api/report-saas/[...path]
/api/safety/[...path]
/api/documents/inspection/pdf
/api/documents/inspection/hwpx
```

## Source readiness gap

| Source file | Status |
|---|---|
| `apps/web/types/mail.ts` | MISSING |
| `apps/web/lib/mail/apiClient.ts` | MISSING |
| `apps/web/features/mailbox/components/MailConnectCallback.tsx` | MISSING |
| `apps/web/features/mailbox/components/MailboxComposeToolbar.tsx` | MISSING |
| `apps/web/features/mailbox/components/MailboxRecipientField.tsx` | MISSING |
| `apps/web/features/mailbox/components/mailboxComposeHelpers.ts` | MISSING |
| `apps/web/types/photos.ts` | MISSING |
| `apps/web/features/photos/components/PhotoAlbumPanel.tsx` | MISSING |
| `apps/web/features/photos/components/PhotoAlbumPanel.module.css` | MISSING |
| `apps/web/lib/safetyApi/adminEndpoints.ts` | MISSING |
| `apps/web/types/backend.ts` | MISSING |
| `apps/web/types/controller.ts` | MISSING |
| `apps/web/types/admin.ts` | MISSING |

# Source Readiness

Step 16 actual scan 기준으로 업데이트한 source readiness 문서다.

## Clean build 기준

```bash
rm -rf apps/web/.next
cd apps/web
npm run build
```

## Confirmed missing watchlist

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

## 우선 조치 순서

1. mailbox source recovery
2. photo-album source recovery
3. headquarters-sites shared types/API source recovery
4. clean build 재실행
5. registry와 known issue 업데이트

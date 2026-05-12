# RC Build & Source Readiness

## 목표

Step 17 source recovery 적용 후 clean build가 통과하는지 확인한다.

## Frontend build

```bash
rm -rf apps/web/.next
cd apps/web
npm run build
```

## 주요 확인 파일

```text
apps/web/types/mail.ts
apps/web/lib/mail/apiClient.ts
apps/web/features/mailbox/components/MailConnectCallback.tsx
apps/web/features/mailbox/components/MailboxComposeToolbar.tsx
apps/web/features/mailbox/components/MailboxRecipientField.tsx
apps/web/features/mailbox/components/mailboxComposeHelpers.ts
apps/web/types/photos.ts
apps/web/features/photos/components/PhotoAlbumPanel.tsx
apps/web/features/photos/components/PhotoAlbumPanel.module.css
apps/web/lib/safetyApi/adminEndpoints.ts
apps/web/types/backend.ts
apps/web/types/controller.ts
apps/web/types/admin.ts
```

## RC 판정

- clean build 실패: release hold
- source readiness issue 재발: release hold
- build 통과 but warning: issue triage로 분류

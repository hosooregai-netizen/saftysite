# Prompt: Apply Source Recovery Safely

```text
너는 Next.js + TypeScript 프로젝트의 source readiness를 안정화하는 시니어 프론트엔드 엔지니어다.

목표:
최신 프로젝트에서 `.next` 캐시에 의존하지 않고 clean build가 가능하도록 누락된 source file을 복구하라.

중요:
이 작업은 기능 고도화가 아니라 build readiness 작업이다.
기존 파일이 이미 있으면 덮어쓰기 전에 반드시 diff를 확인하라.

반드시 확인할 파일:
- apps/web/lib/mailboxApi.ts
- apps/web/features/mailbox/components/MailboxShellScreen.tsx
- apps/web/features/mailbox/components/MailboxComposePanel.tsx
- apps/web/components/ErpPhotoAlbumScreen.tsx
- apps/web/components/HeadquartersHubScreen.tsx
- apps/web/components/SitesHubScreen.tsx
- apps/web/app/reports/new/page.tsx
- apps/web/lib/guestWorkspaceCache.ts
- apps/web/lib/appsSafetySession.ts

복구 대상:
- apps/web/types/mail.ts
- apps/web/lib/mail/apiClient.ts
- apps/web/features/mailbox/components/MailConnectCallback.tsx
- apps/web/features/mailbox/components/MailboxComposeToolbar.tsx
- apps/web/features/mailbox/components/MailboxRecipientField.tsx
- apps/web/features/mailbox/components/mailboxComposeHelpers.ts
- apps/web/types/photos.ts
- apps/web/features/photos/components/PhotoAlbumPanel.tsx
- apps/web/features/photos/components/PhotoAlbumPanel.module.css
- apps/web/types/backend.ts
- apps/web/types/controller.ts
- apps/web/types/admin.ts
- apps/web/lib/safetyApi.ts
- apps/web/lib/safetyApi/authStorage.ts
- apps/web/lib/safetyApi/adminEndpoints.ts
- apps/web/lib/admin.ts
- apps/web/lib/admin/apiClient.ts

절대 수정하지 말 것:
- apps/web/.next
- apps/api/.venv
- __MACOSX
- 관련 없는 기능 로직

검증:
rm -rf apps/web/.next
cd apps/web
npm run build

완료 기준:
- missing import error가 사라진다.
- /mailbox, /photo-album, /headquarters, /sites, /reports/new가 build 대상에서 실패하지 않는다.
- build 실패 시 남은 오류를 기능별로 분류해 보고한다.
```

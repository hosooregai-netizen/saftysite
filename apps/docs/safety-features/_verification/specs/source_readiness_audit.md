# Source Readiness Audit

스캔 기준: `apps(3).zip`

## Watchlist status

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

## Missing files

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

## Import references to watched modules

| Importing source | Import target |
|---|---|
| `apps/web/features/mailbox/components/MailboxSidebar.tsx` | `@/types/mail` |
| `apps/web/components/SitesHubScreen.tsx` | `@/types/backend` |
| `apps/web/features/mailbox/components/MailboxComposePanel.tsx` | `@/features/mailbox/components/MailboxComposeToolbar` |
| `apps/web/features/mailbox/components/MailboxComposePanel.tsx` | `@/features/mailbox/components/MailboxRecipientField` |
| `apps/web/components/HeadquartersHubScreen.tsx` | `@/lib/safetyApi/adminEndpoints` |
| `apps/web/components/HeadquartersHubScreen.tsx` | `@/types/backend` |
| `apps/web/components/HeadquartersHubScreen.tsx` | `@/types/controller` |
| `apps/web/components/HeadquartersHubScreen.tsx` | `@/types/admin` |
| `apps/web/lib/mailboxApi.ts` | `@/types/mail` |
| `apps/web/lib/mailboxApi.ts` | `@/lib/mail/apiClient` |
| `apps/web/components/ErpPhotoAlbumScreen.tsx` | `@/types/photos` |
| `apps/web/components/ErpPhotoAlbumScreen.tsx` | `@/features/photos/components/PhotoAlbumPanel` |
| `apps/web/components/ErpPhotoAlbumScreen.tsx` | `@/lib/safetyApi/adminEndpoints` |
| `apps/web/components/ErpPhotoAlbumScreen.tsx` | `@/types/backend` |
| `apps/web/components/ErpPhotoAlbumScreen.tsx` | `@/types/controller` |
| `apps/web/app/mail/connect/google/page.tsx` | `@/features/mailbox/components/MailConnectCallback` |
| `apps/web/features/mailbox/components/MailboxViewerPane.tsx` | `@/types/mail` |
| `apps/web/features/mailbox/components/MailboxViewerPane.tsx` | `@/features/mailbox/components/mailboxComposeHelpers` |
| `apps/web/lib/guestWorkspaceCache.ts` | `@/types/backend` |
| `apps/web/lib/guestWorkspaceCache.ts` | `@/types/controller` |
| `apps/web/lib/appsSafetySession.ts` | `@/types/backend` |
| `apps/web/features/mailbox/components/MailboxShellScreen.tsx` | `@/types/mail` |
| `apps/web/features/mailbox/components/MailboxShellScreen.tsx` | `@/features/mailbox/components/mailboxComposeHelpers` |
| `apps/web/app/reports/new/page.tsx` | `@/lib/safetyApi/adminEndpoints` |
| `apps/web/app/reports/new/page.tsx` | `@/types/backend` |
| `apps/web/app/reports/new/page.tsx` | `@/types/controller` |
| `apps/web/features/mailbox/components/MailboxThreadListPane.tsx` | `@/types/mail` |

## 판단

현재 watchlist 기준으로 mailbox, photo-album, headquarters-sites의 clean build risk가 높다.

특히 다음 import는 source tree에 대상 파일이 없는데 코드에서 참조된다.

- `@/types/mail`
- `@/lib/mail/apiClient`
- `@/features/mailbox/components/MailConnectCallback`
- `@/features/mailbox/components/MailboxComposeToolbar`
- `@/features/mailbox/components/MailboxRecipientField`
- `@/features/mailbox/components/mailboxComposeHelpers`
- `@/types/photos`
- `@/features/photos/components/PhotoAlbumPanel`
- `@/lib/safetyApi/adminEndpoints`
- `@/types/backend`
- `@/types/controller`
- `@/types/admin`

## 다음 조치

1. source recovery를 먼저 적용한다.
2. `.next` 삭제 후 clean build를 수행한다.
3. missing import가 사라질 때까지 기능별 source readiness 문서를 업데이트한다.

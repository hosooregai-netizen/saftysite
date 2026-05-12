# Source Readiness Registry

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

## Import references

| Importing source | Import target |
|---|---|
| `apps/web/components/ErpPhotoAlbumScreen.tsx` | `@/types/photos` |
| `apps/web/components/ErpPhotoAlbumScreen.tsx` | `@/features/photos/components/PhotoAlbumPanel` |
| `apps/web/components/ErpPhotoAlbumScreen.tsx` | `@/lib/safetyApi/adminEndpoints` |
| `apps/web/components/ErpPhotoAlbumScreen.tsx` | `@/types/backend` |
| `apps/web/components/ErpPhotoAlbumScreen.tsx` | `@/types/controller` |
| `apps/web/features/mailbox/components/MailboxComposePanel.tsx` | `@/features/mailbox/components/MailboxComposeToolbar` |
| `apps/web/features/mailbox/components/MailboxComposePanel.tsx` | `@/features/mailbox/components/MailboxRecipientField` |
| `apps/web/features/mailbox/components/MailboxViewerPane.tsx` | `@/types/mail` |
| `apps/web/features/mailbox/components/MailboxViewerPane.tsx` | `@/features/mailbox/components/mailboxComposeHelpers` |
| `apps/web/features/mailbox/components/MailboxSidebar.tsx` | `@/types/mail` |
| `apps/web/app/mail/connect/google/page.tsx` | `@/features/mailbox/components/MailConnectCallback` |
| `apps/web/lib/guestWorkspaceCache.ts` | `@/types/backend` |
| `apps/web/lib/guestWorkspaceCache.ts` | `@/types/controller` |
| `apps/web/lib/appsSafetySession.ts` | `@/types/backend` |
| `apps/web/features/mailbox/components/MailboxThreadListPane.tsx` | `@/types/mail` |
| `apps/web/components/HeadquartersHubScreen.tsx` | `@/lib/safetyApi/adminEndpoints` |
| `apps/web/components/HeadquartersHubScreen.tsx` | `@/types/backend` |
| `apps/web/components/HeadquartersHubScreen.tsx` | `@/types/controller` |
| `apps/web/components/HeadquartersHubScreen.tsx` | `@/types/admin` |
| `apps/web/components/SitesHubScreen.tsx` | `@/types/backend` |
| `apps/web/app/reports/new/page.tsx` | `@/lib/safetyApi/adminEndpoints` |
| `apps/web/app/reports/new/page.tsx` | `@/types/backend` |
| `apps/web/app/reports/new/page.tsx` | `@/types/controller` |
| `apps/web/lib/mailboxApi.ts` | `@/types/mail` |
| `apps/web/lib/mailboxApi.ts` | `@/lib/mail/apiClient` |
| `apps/web/features/mailbox/components/MailboxShellScreen.tsx` | `@/types/mail` |
| `apps/web/features/mailbox/components/MailboxShellScreen.tsx` | `@/features/mailbox/components/mailboxComposeHelpers` |

## 기능별 분류

| Feature | Missing group |
|---|---|
| mailbox | mail types, mail apiClient, callback, compose toolbar, recipient field, compose helpers |
| photo-album | photo types, PhotoAlbumPanel component/CSS |
| headquarters-sites | safety API admin endpoints, backend/controller/admin types |

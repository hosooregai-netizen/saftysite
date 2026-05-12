# Known Issue Registry

## Step 16 actual scan issues

| Issue | Features | Status |
|---|---|---|
| Missing source readiness files | mailbox, photo-album, headquarters-sites | confirmed in `apps(3).zip` |
| `/dashboard` route not previously indexed | dashboard/app-home | patched |
| `/pricing` route not previously indexed | billing-credits/pricing | patched |
| Frontend API proxy routes need separation | api proxy | patched |
| API registry was group-level only | all backend features | actual endpoint inventory added |

## Missing source list

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

## Existing high-risk issues

- Workspace Google auth와 Gmail connect 혼동
- Drive public share root boundary
- Toss webhook idempotency
- report export billing policy
- guest import duplication

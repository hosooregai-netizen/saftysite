# Clean Build

## Frontend

```bash
rm -rf apps/web/.next
cd apps/web
npm run build
```

## Backend

```bash
cd apps/api
python -m compileall app
```

## Source readiness watchlist

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
apps/web/features/admin/sections/headquarters/*
apps/web/features/admin/sections/sites/*
```

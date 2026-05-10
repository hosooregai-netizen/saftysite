# Import Resolution Checklist

## 반드시 해결되어야 하는 import

```text
@/types/mail
@/lib/mail/apiClient
@/features/mailbox/components/MailConnectCallback
@/features/mailbox/components/MailboxComposeToolbar
@/features/mailbox/components/MailboxRecipientField
@/features/mailbox/components/mailboxComposeHelpers

@/types/photos
@/features/photos/components/PhotoAlbumPanel

@/lib/safetyApi/adminEndpoints
@/types/backend
@/types/controller
@/types/admin

@/components/providers/AppProviders
@/components/branding/InstituteWordmark
@/components/ui/AppModal
@/components/ui/SubmitSearchField

@/server/admin/safetyApiServer
@/server/documents/inspection/standardHwpx
@/server/documents/inspection/hwpxToPdf
@/server/documents/inspection/requestResolver
@/server/documents/shared/generatedReportPdfCache
@/types/documents
```

## 검증 방법

```bash
grep -R "@/types/mail" apps/web --exclude-dir=.next
grep -R "@/features/photos/components/PhotoAlbumPanel" apps/web --exclude-dir=.next
grep -R "@/lib/safetyApi/adminEndpoints" apps/web --exclude-dir=.next
```

그리고 실제 파일 존재 여부를 확인한다.

```bash
test -f apps/web/types/mail.ts
test -f apps/web/types/photos.ts
test -f apps/web/lib/safetyApi/adminEndpoints.ts
```

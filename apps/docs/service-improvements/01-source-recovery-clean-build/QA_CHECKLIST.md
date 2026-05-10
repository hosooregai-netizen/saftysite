# QA Checklist

## Build

- [ ] `rm -rf apps/web/.next`
- [ ] `cd apps/web`
- [ ] `npm run build`

## Missing import 확인

- [ ] `@/types/mail`
- [ ] `@/lib/mail/apiClient`
- [ ] `@/features/mailbox/components/MailConnectCallback`
- [ ] `@/features/mailbox/components/MailboxComposeToolbar`
- [ ] `@/features/mailbox/components/MailboxRecipientField`
- [ ] `@/features/mailbox/components/mailboxComposeHelpers`
- [ ] `@/types/photos`
- [ ] `@/features/photos/components/PhotoAlbumPanel`
- [ ] `@/lib/safetyApi/adminEndpoints`
- [ ] `@/types/backend`
- [ ] `@/types/controller`
- [ ] `@/types/admin`

## Route smoke

- [ ] `/mailbox`
- [ ] `/mail/connect/google?error=access_denied`
- [ ] `/photo-album`
- [ ] `/headquarters`
- [ ] `/sites`
- [ ] `/reports/new`

## 통과 후 다음

- [ ] 메일함 상태 정합성 개선 시작
- [ ] 웹하드 공유/권한 개선은 메일함 다음 순서

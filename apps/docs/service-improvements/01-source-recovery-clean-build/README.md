# Service Improvement 01: Source Recovery & Clean Build

## 목적

서비스 개선을 시작하기 전에 `.next` 캐시에 의존하지 않는 source tree 기준으로 빌드 가능한 상태를 만든다.

현재 최신본에서 메일함, 사진첩, 사업장/현장 관련 일부 import 대상이 source tree에 없을 수 있으므로, 이 패키지는 해당 missing source 파일을 우선 복구한다.

## 이 패키지가 먼저인 이유

기능 UI를 고도화하기 전에 build가 안정적이어야 한다. source file이 누락된 상태에서 메일함, 웹하드, 보고서 기능을 계속 수정하면 clean build 또는 배포 시 실패할 수 있다.

## 포함 범위

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

apps/web/types/backend.ts
apps/web/types/controller.ts
apps/web/types/admin.ts
apps/web/lib/safetyApi.ts
apps/web/lib/safetyApi/authStorage.ts
apps/web/lib/safetyApi/adminEndpoints.ts
apps/web/lib/admin.ts
apps/web/lib/admin/apiClient.ts

apps/web/components/providers/AppProviders.tsx
apps/web/components/branding/InstituteWordmark.tsx
apps/web/components/ui/AppModal.tsx
apps/web/components/ui/SubmitSearchField.tsx
apps/web/lib/clientPersistence.ts
apps/web/lib/api.ts
```

## 적용 원칙

- 기존 파일이 이미 있으면 바로 덮어쓰지 말고 diff를 확인한다.
- 이 overlay는 missing source를 복구하는 MVP fallback이다.
- 실제 기능 고도화는 build 통과 후 `mailbox`, `webhard`, `report-workspace` 순서로 진행한다.

## 적용 후 검증

```bash
rm -rf apps/web/.next
cd apps/web
npm run build
```

## 다음 단계

build가 통과하면 다음 개선은 `Service Improvement 02: Mailbox State Consistency & 3-Pane Hardening`이다.

build가 실패하면 build log를 기준으로 `Remaining Build Error Patch`를 만든다.

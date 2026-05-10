# Service Improvement 02: Mailbox State Consistency

## 목적

메일함에서 OAuth 성공 메시지와 “연결된 메일 계정이 없습니다” 상태가 동시에 표시되는 상태 모순을 제거하고, mailbox API 응답의 snake_case/camelCase 차이를 정규화한다.

현재 관찰된 문제:

```text
구글 메일 계정을 연결했습니다.
연결된 메일 계정이 없습니다.
```

이 조합은 사용자에게 OAuth는 성공했는데 계정이 없는 것처럼 보이게 하므로 release blocker로 본다.

## 적용 범위

```text
apps/web/types/mail.ts
apps/web/lib/mail/apiClient.ts
apps/web/features/mailbox/components/mailboxComposeHelpers.ts
apps/web/features/mailbox/components/MailboxOnboardingState.tsx
apps/web/features/mailbox/components/MailboxShellScreen.tsx
```

## 기대 효과

- OAuth 성공 직후에는 “메일 계정 정보를 불러오는 중입니다” 상태를 표시한다.
- 실제 계정이 없을 때만 “메일 사용을 시작하려면 계정 연결이 필요합니다”를 표시한다.
- `authorization_url` / `authorizationUrl` 차이를 정규화한다.
- `sync` API의 snake_case 응답을 `threadCount`, `messageCount` 등으로 정규화한다.
- `fetchMailThreads`는 항상 `{ rows, total }` 형태를 반환한다.

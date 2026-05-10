# Service Improvement 02 Prompt: Mailbox State Consistency

```text
너는 Next.js 메일함 기능의 상태 정합성과 API 응답 정규화를 개선하는 시니어 프론트엔드 엔지니어다.

목표:
메일함에서 OAuth 성공 메시지와 “연결된 메일 계정이 없습니다”가 동시에 보이는 상태 모순을 제거하고, backend snake_case 응답을 frontend camelCase 상태로 정규화하라.

대상 파일:
- apps/web/types/mail.ts
- apps/web/lib/mail/apiClient.ts
- apps/web/features/mailbox/components/mailboxComposeHelpers.ts
- apps/web/features/mailbox/components/MailboxOnboardingState.tsx
- apps/web/features/mailbox/components/MailboxShellScreen.tsx

요구사항:
1. OAuth 성공 직후 계정 목록이 아직 비어 있으면 `oauth_success_pending_refresh` 상태를 표시하라.
2. 이 상태에서는 “연결된 메일 계정이 없습니다”를 표시하지 마라.
3. 실제 계정이 없을 때만 “메일 사용을 시작하려면 계정 연결이 필요합니다”를 표시하라.
4. `authorization_url`을 `authorizationUrl`로 정규화하라.
5. `/mail/threads` 응답을 항상 `{ rows, total }`로 처리하라.
6. `/mail/sync` 응답의 `thread_count`, `message_count`, `sync_errors` 등을 camelCase로 정규화하라.
7. Workspace Google login과 Gmail connect 문구를 분리하라.
8. build와 route smoke를 통과하라.

검증:
rm -rf apps/web/.next
cd apps/web
npm run build

Route smoke:
- /mailbox
- /mail/connect/google?error=access_denied
- /mail/connect/google?code=dummy&state=dummy

완료 기준:
- OAuth 성공 + 계정 없음 상태 모순이 사라진다.
- 연결 계정 있음/없음/동기화 중/메일 0건 상태가 명확히 분리된다.
```

# Service Improvement 05 Prompt: Mailbox Gmail Sync UX & Reconnect State

```text
너는 Gmail 연동 메일함 UX와 React 상태 관리를 이해하는 시니어 프론트엔드 엔지니어다.

목표:
메일함에서 Gmail 동기화 상태, 초기 백필 상태, token refresh 실패, 재연결 필요 상태를 명확히 표시하라.

대상 파일:
- apps/web/features/mailbox/components/MailboxShellScreen.tsx
- apps/web/features/mailbox/components/MailboxSyncStatusBanner.tsx
- apps/web/types/mail.ts
- apps/web/lib/mail/apiClient.ts

요구사항:
1. Gmail account metadata의 initialBackfillCompleted, syncStatus, syncError, lastFullSyncAt, lastIncrementalSyncAt을 UI에 반영하라.
2. 초기 동기화가 필요하면 “초기 Gmail 동기화가 필요합니다.” 상태를 표시하라.
3. syncStatus가 backfilling/incremental이면 동기화 중 상태를 표시하라.
4. syncError가 있으면 오류를 표시하라.
5. refresh token, invalid_grant, unauthorized, 재연결 관련 오류는 “구글 메일 재연결” CTA를 표시하라.
6. 동기화 완료 계정은 마지막 동기화 시각을 표시하라.
7. 수동 동기화 버튼을 제공하라.
8. 계정 없음 state와 연결됨+메일 없음 state를 혼동하지 마라.
9. 메일함 three-pane layout은 유지하라.

검증:
rm -rf apps/web/.next
cd apps/web
npm run build

완료 기준:
- /mailbox route에서 동기화 상태가 명확하다.
- 재연결 필요 계정은 reconnect CTA가 보인다.
- 연결 계정 있음 + 메일 0건 상태가 계정 없음으로 오인되지 않는다.
```

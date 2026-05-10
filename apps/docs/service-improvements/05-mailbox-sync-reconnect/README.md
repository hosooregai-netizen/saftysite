# Service Improvement 05: Mailbox Gmail Sync UX & Reconnect State

## 목적

4단계에서 backend Gmail API 발송을 연결한 뒤, 프론트 메일함에서 Gmail 동기화 상태와 재연결 필요 상태를 명확히 보여준다.

현재 메일함에서 사용자가 혼란스러워하는 핵심은 다음이다.

```text
계정은 연결된 것 같은데 받은편지함이 0건이다.
동기화가 안 된 건지, 메일이 없는 건지, 재연결이 필요한지 알기 어렵다.
```

이번 단계는 이 상태를 명확히 분리한다.

## 적용 파일

```text
apps/web/features/mailbox/components/MailboxShellScreen.tsx
apps/web/features/mailbox/components/MailboxSyncStatusBanner.tsx
apps/web/types/mail.ts
apps/web/lib/mail/apiClient.ts
```

## 개선 내용

- Gmail 초기 백필 필요 상태 표시
- Gmail 동기화 중 상태 표시
- 마지막 동기화 시각 표시
- syncError 표시
- refresh token/invalid_grant/unauthorized 감지 시 재연결 CTA 표시
- 수동 동기화 버튼 제공

## 적용 순서

```bash
unzip service_improvement_01_source_recovery_clean_build_overlay.zip
unzip service_improvement_02_mailbox_state_consistency_overlay.zip
unzip service_improvement_03_mailbox_threepane_compose_overlay.zip
unzip service_improvement_04_gmail_send_sync_overlay.zip
unzip service_improvement_05_mailbox_sync_reconnect_overlay.zip

rm -rf apps/web/.next
cd apps/web
npm run build
```

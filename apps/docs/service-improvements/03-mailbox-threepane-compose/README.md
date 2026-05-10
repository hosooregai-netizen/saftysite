# Service Improvement 03: Mailbox 3-Pane & Compose Hardening

## 목적

1단계 source recovery와 2단계 mailbox state consistency 이후, 메일 작성창과 수신자 입력 UI가 실제 빌드에서 안정적으로 동작하도록 보강한다.

## 적용 파일

```text
apps/web/features/mailbox/components/MailboxRecipientField.tsx
apps/web/features/mailbox/components/MailboxComposeToolbar.tsx
apps/web/features/mailbox/components/MailboxComposePanel.tsx
```

## 핵심 개선

- `MailboxRecipientField` prop 호환성 보강
- 수신자 chip / 추천 목록 / keyboard 입력 안정화
- `MailboxComposeToolbar`를 현재 compose panel의 `onCommand/onLink` 방식과 호환
- 받는 사람 없는 상태에서 발송 버튼 비활성화
- 제목/본문/첨부가 모두 없으면 발송 비활성화
- 첨부 제거 버튼 접근성 보강

## 적용 순서

```bash
unzip service_improvement_01_source_recovery_clean_build_overlay.zip
unzip service_improvement_02_mailbox_state_consistency_overlay.zip
unzip service_improvement_03_mailbox_threepane_compose_overlay.zip

rm -rf apps/web/.next
cd apps/web
npm run build
```

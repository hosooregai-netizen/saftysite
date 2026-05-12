# 10_HARDEN_COMPOSE_PANEL_AFTER_RECOVERY

```text
너는 메일 작성 UX를 안정화하는 시니어 프론트엔드 엔지니어다.

목표:
새 메일/답장/전달/임시저장 compose panel을 안정화하라.

참조 문서:
- docs/safety-features/mailbox/specs/compose_hardening.md

대상 코드:
- MailboxComposePanel.tsx
- MailboxComposeToolbar.tsx
- MailboxRecipientField.tsx
- mailboxComposeHelpers.ts
- mailboxApi.ts

요구사항:
1. recipient 입력/삭제/추천 선택을 안정화하라.
2. reply/forward subject/body helper를 검증하라.
3. 첨부 추가/삭제와 base64 변환 실패 처리를 분리하라.
4. 보내기 전 수신자 validation을 적용하라.
5. 닫기 전 draft 저장 또는 discard 확인을 제공하라.

완료 기준:
- 새 메일, 답장, 전달, 임시저장이 모두 동작한다.
- compose panel을 닫아도 작성 내용 손실 위험이 줄어든다.
```

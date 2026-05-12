# Service Improvement 03 Prompt: Mailbox 3-Pane & Compose Hardening

```text
너는 Gmail/Naver Mail 스타일의 메일함 UI와 React/Next.js 타입 안정화를 모두 이해하는 시니어 프론트엔드 엔지니어다.

목표:
메일함의 3-pane layout은 유지하면서, 작성창과 수신자 입력 컴포넌트의 타입/props 호환성과 사용성을 개선하라.

대상 파일:
- apps/web/features/mailbox/components/MailboxRecipientField.tsx
- apps/web/features/mailbox/components/MailboxComposeToolbar.tsx
- apps/web/features/mailbox/components/MailboxComposePanel.tsx

요구사항:
1. MailboxRecipientField는 기존 ComposePanel이 넘기는 onChangeInput, onKeyDown, onFocusInput, onBlur props를 지원해야 한다.
2. MailboxRecipientField는 이전 overlay의 onInputChange, onInputKeyDown props도 호환해야 한다.
3. 수신자 chip, 삭제, 추천 목록, keyboard selection을 지원하라.
4. MailboxComposeToolbar는 onCommand/onLink 기반 본문 서식 도구를 지원해야 한다.
5. 받는 사람이 없으면 발송 버튼을 비활성화하라.
6. 제목/본문/첨부가 모두 없으면 발송 버튼을 비활성화하라.
7. 작성창 최소화/최대화/닫기 기능은 유지하라.
8. 메일함 three-pane layout은 유지하라.
9. 웹하드, 보고서, 사진첩, 사업장/현장 기능은 수정하지 마라.

검증:
rm -rf apps/web/.next
cd apps/web
npm run build

완료 기준:
- /mailbox route build가 깨지지 않는다.
- 새 메일 작성창이 동작한다.
- 수신자 입력과 추천 선택이 동작한다.
- 잘못된 발송 시도를 UI에서 막는다.
```

# Service Improvement 04 Prompt: Gmail Send & Sync Backend Integration

```text
너는 Gmail API와 FastAPI/Mongo 기반 메일함을 구현하는 시니어 백엔드 엔지니어다.

목표:
메일함의 Google 계정 발송을 local outbox 저장이 아니라 실제 Gmail API `messages.send`로 연결하라.

대상 파일:
- apps/api/app/mail_google_service.py
- apps/api/app/apps_stack.py

현재 상태:
- Google OAuth code exchange, refresh token 저장, Gmail profile 조회, sync 함수는 존재한다.
- send_mail_message()는 현재 local message/outbox 저장 중심이다.
- Google 계정 발송 시 Gmail API send를 먼저 호출하고, 성공 결과를 local DB에 저장해야 한다.

요구사항:
1. mail_google_service.py에 send_gmail_message()를 추가하라.
2. send_gmail_message()는 Gmail API /messages/send를 호출해야 한다.
3. to/cc/subject/bodyHtml/bodyText/attachments/dataBase64를 처리하라.
4. access token이 만료되었으면 기존 _ensure_google_mail_access_token()을 통해 갱신하라.
5. Google account에서는 Gmail send 성공 후 local message를 저장하라.
6. Gmail send 실패 시 local outbox만 저장하지 말고 실패를 반환하라.
7. providerMessageId/providerThreadId/sentVia를 message metadata에 저장하라.
8. Google 이외 provider는 기존 local outbox 동작을 유지하라.
9. token은 로그에 출력하지 마라.

검증:
cd apps/api
python -m compileall app

그리고 frontend:
rm -rf apps/web/.next
cd apps/web
npm run build

완료 기준:
- Google 계정에서 /api/v1/mail/send 호출 시 Gmail API send가 실행된다.
- 성공 시 보낸 메일 local thread/message가 저장된다.
- 실패 시 사용자에게 오류가 표시된다.
```

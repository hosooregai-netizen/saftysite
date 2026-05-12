# Service Improvement 04: Gmail Send & Sync Backend Integration

## 목적

1~3단계에서 메일함 source/build와 UI/작성 흐름을 안정화한 뒤, 실제 Gmail API 발송을 backend에 연결한다.

최신 backend에는 Google OAuth token exchange, refresh token 암호화 저장, Gmail profile 조회, initial/incremental sync 흐름이 이미 존재한다. 이번 단계는 `send_mail_message()`가 local outbox 저장만 하는 것이 아니라, Google 계정에서는 Gmail API `messages.send`를 먼저 호출하도록 보강한다.

## 적용 파일

```text
apps/api/app/mail_google_service.py
apps/api/app/apps_stack.py
```

## 핵심 개선

- `send_gmail_message()` 추가
- Gmail API `/messages/send` 호출
- dataBase64 attachment 포함
- Gmail response의 providerMessageId/providerThreadId 저장
- Gmail 발송 실패 시 local outbox만 저장하지 않고 실패 처리
- Google 계정이 아닌 provider는 기존 local outbox 동작 유지

## 적용 순서

```bash
unzip service_improvement_01_source_recovery_clean_build_overlay.zip
unzip service_improvement_02_mailbox_state_consistency_overlay.zip
unzip service_improvement_03_mailbox_threepane_compose_overlay.zip
unzip service_improvement_04_gmail_send_sync_overlay.zip

rm -rf apps/web/.next
cd apps/web
npm run build
```

Backend도 확인한다.

```bash
cd apps/api
python -m compileall app
```

## 환경변수

```text
GOOGLE_MAIL_CLIENT_ID
GOOGLE_MAIL_CLIENT_SECRET
GOOGLE_MAIL_ALLOWED_REDIRECT_URIS
MAIL_ACCOUNT_TOKEN_SECRET
```

OAuth scope에는 최소 아래가 필요하다.

```text
openid email profile
https://www.googleapis.com/auth/gmail.modify
https://www.googleapis.com/auth/gmail.send
```

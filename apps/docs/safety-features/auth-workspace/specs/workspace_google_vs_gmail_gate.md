# Workspace Google Auth vs Gmail Connect Gate

## Route 분리

```text
/auth/google/callback
→ 앱 로그인 / Workspace membership

/mail/connect/google
→ Gmail API 계정 연결 / refresh token / sync / send
```

## UI 문구

- 앱 로그인 필요: `Google로 로그인`
- 메일 연결 필요: `구글 메일 연결`
- Gmail reconnect 필요: `구글 메일 재연결`

## QA

- Workspace login success가 Gmail connected로 표시되지 않음
- Gmail connect success가 app login으로 처리되지 않음

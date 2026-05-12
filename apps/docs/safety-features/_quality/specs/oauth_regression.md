# OAuth Regression

## 분리 원칙

```text
/auth/google/callback
→ 앱 로그인 / workspace membership

/mail/connect/google
→ Gmail API 계정 연결 / refresh token / sync / send
```

## 테스트

- Workspace login success/error
- Gmail connect success/error
- invalid state
- repeated state
- redirect_uri mismatch
- token refresh failure
- reconnect_required 표시

# OAuth Token Operations

## 분리 원칙

```text
Workspace Google Auth
→ /auth/google/callback
→ 앱 로그인

Gmail Connect
→ /mail/connect/google
→ Gmail API token
```

## 운영 점검

- Gmail account connectionStatus
- refresh token availability
- token refresh failure count
- reconnect_required accounts
- syncError metadata
- OAuth invalid state attempts

## User-facing 상태

| Backend state | UI |
|---|---|
| connected | 연결 완료 |
| reconnect_required | 재연결 필요 |
| sync_failed | 동기화 실패 |
| provider_unavailable | 공급자 설정 필요 |
| no_accounts | 메일 계정 연결 필요 |

## 알림

- reconnect_required 급증
- token refresh failure spike
- OAuth callback error spike

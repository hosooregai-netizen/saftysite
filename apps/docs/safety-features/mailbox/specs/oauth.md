# OAuth Spec: Mailbox

## 1. Goal

메일함 OAuth는 사용자가 Google Mail 계정을 안전하게 연결하고, Gmail API 접근에 필요한 token을 workspace/user scoped account에 저장하는 흐름이다.

## 2. Providers

| Provider | Status | Route |
|---|---|---|
| Google | P0 | `/mail/connect/google` |
| Naver Mail | P2 | `/mail/connect/naver` |
| Naver Works | P2 | `/mail/connect/naver-works` |

## 3. Google OAuth Flow

```text
1. User clicks "구글 메일 연결"
2. Frontend calls POST /api/v1/mail/accounts/connect/google/start
3. Backend validates redirect_uri
4. Backend creates OAuth state
5. Backend returns Google authUrl
6. Browser redirects to Google
7. Google redirects back to /mail/connect/google?code=&state=
8. MailConnectCallback calls complete endpoint
9. Backend validates state and redirect_uri
10. Backend exchanges code for tokens
11. Backend fetches userinfo/Gmail profile
12. Backend encrypts and stores tokens
13. Backend upserts MailAccount
14. Frontend redirects to /mailbox with success notice
```

## 4. State Requirements

OAuth state document should include:

```json
{
  "state": "opaque_random",
  "provider": "google",
  "workspace_id": "workspace_x",
  "user_id": "user_x",
  "redirect_uri": "http://localhost:3000/mail/connect/google",
  "expires_at": "2026-05-05T12:15:00Z",
  "consumed_at": null,
  "created_at": "2026-05-05T12:00:00Z"
}
```

Rules:

- TTL default: 15 minutes.
- State must be bound to provider, workspace, user, redirect URI.
- State must be single-use.
- Expired or consumed state must fail.

## 5. Redirect URI Rules

Development allowlist should include both localhost and 127.0.0.1 when needed:

```text
http://localhost:3000/mail/connect/google
http://127.0.0.1:3000/mail/connect/google
```

Production allowlist must be exact HTTPS origin.

## 6. Token Storage

MailAccount must not expose tokens.

Persisted token storage fields may include:

```json
{
  "access_token_ciphertext": "...",
  "refresh_token_ciphertext": "...",
  "token_expires_at": "2026-05-05T13:00:00Z",
  "scope": "openid email profile https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/gmail.send"
}
```

Requirements:

- refresh_token encrypted at rest.
- access_token can be encrypted or short-lived in encrypted storage.
- token values are never returned to frontend.
- token secret must be configured through env var.
- missing token secret in production must fail loudly.

## 7. Scopes

MVP can be staged.

| Stage | Scopes |
|---|---|
| Connect identity | `openid email profile` |
| Send only | `https://www.googleapis.com/auth/gmail.send` |
| Read inbox | `https://www.googleapis.com/auth/gmail.readonly` |
| Modify/archive/trash/read state | `https://www.googleapis.com/auth/gmail.modify` |

Recommended MVP for real inbox + send:

```text
openid email profile
https://www.googleapis.com/auth/gmail.modify
https://www.googleapis.com/auth/gmail.send
```

## 8. Account Upsert

If same provider account is connected again by same workspace/user:

- update tokens
- set `connectionStatus=connected`
- refresh email/displayName/profile metadata
- do not create duplicate account unless explicit multi-account mode is supported

If provider account belongs to another user/workspace:

- enforce workspace/user policy
- never leak existing owner details

## 9. OAuth UI States

| State | UI |
|---|---|
| ready | "구글 메일 연결" |
| connecting | callback loading |
| success | toast/snackbar and account chip |
| access_denied | clear error, reconnect CTA |
| state_error | "연결 요청이 만료되었습니다" |
| token_error | "구글 메일 연결을 완료하지 못했습니다" |
| reconnect_required | account badge and CTA |

## 10. Known OAuth Regression

Do not allow this state:

```text
"구글 메일 계정을 연결했습니다."
+
"연결된 메일 계정이 없습니다."
```

If complete endpoint succeeds, accounts list must include the account or the UI must show a sync/account fetch error, not an account-empty state.

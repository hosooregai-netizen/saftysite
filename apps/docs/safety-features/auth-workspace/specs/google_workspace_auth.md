# Google Workspace Auth

## 목적

앱 사용자를 Google 계정으로 인증하고 workspace membership을 생성/조회한다.

## Gmail OAuth와의 차이

| 구분 | Route | 목적 |
|---|---|---|
| Workspace Google 로그인 | `/auth/google/callback` | 앱 계정/워크스페이스 인증 |
| Gmail 메일 연결 | `/mail/connect/google` | Gmail API 토큰/메일함 연결 |

두 flow를 섞으면 안 된다. Workspace 로그인에 성공해도 Gmail 받은편지함이 연결된 것은 아니다.

## Frontend flow

```text
beginGoogleWorkspaceAuth
→ startGoogleWorkspaceAuth
→ state context 저장
→ Google authorization_url 이동
→ callback page
→ completeGoogleWorkspaceAuthCallback
→ session 저장
→ claim/import
→ nextPath 이동
```

## Backend flow

```text
require_google_app_configuration
→ validate_google_app_redirect_uri
→ store.auth_oauth_states[state]
→ build_google_app_authorization_url
→ exchange_google_app_code
→ resolve_or_create_google_user
→ build_auth_response
```

## Redirect URI

개발 환경에서는 `localhost`와 `127.0.0.1`을 혼동하지 않도록 둘 다 allowlist에 넣거나 하나로 통일한다.

```env
APP_BASE_URL=http://localhost:3000
GOOGLE_APP_ALLOWED_REDIRECT_URIS=http://localhost:3000/auth/google/callback,http://127.0.0.1:3000/auth/google/callback
```

## 보안 기준

- state는 1회성으로 소비한다.
- redirect_uri는 allowlist로 검증한다.
- OAuth code/token/profile은 로그에 남기지 않는다.
- profile email/sub 기준으로 user를 resolve/create한다.
- Google login과 Gmail API scope를 분리한다.

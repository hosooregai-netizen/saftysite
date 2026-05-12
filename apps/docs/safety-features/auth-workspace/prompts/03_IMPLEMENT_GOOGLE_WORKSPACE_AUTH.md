# 03_IMPLEMENT_GOOGLE_WORKSPACE_AUTH

```text
너는 Google Workspace 로그인 flow를 안정화하는 시니어 풀스택 엔지니어다.

목표:
Workspace 로그인용 Google OAuth flow를 검증/보강하라. Gmail 메일 연결 OAuth와 절대 섞지 마라.

참조 문서:
- docs/safety-features/auth-workspace/specs/google_workspace_auth.md
- docs/safety-features/auth-workspace/specs/token_storage.md
- docs/safety-features/mailbox/specs/oauth.md

대상 코드:
- apps/web/lib/sessionAuthFlow.ts
- apps/web/app/auth/google/callback/page.tsx
- apps/web/components/AccountSettingsScreen.tsx
- apps/api/app/main.py
- apps/api/app/config.py

요구사항:
1. redirect_uri allowlist를 검증하라.
2. OAuth state를 1회성으로 소비하라.
3. state context를 callback 후 삭제하라.
4. Google code/profile/token을 로그에 남기지 마라.
5. callback error query를 사용자 친화적으로 처리하라.
6. Workspace auth와 Gmail auth 문구를 분리하라.

완료 기준:
- Google Workspace login이 authenticated session을 만든다.
- Gmail 계정 연결 상태와 혼동되지 않는다.
```

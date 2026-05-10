# 03_IMPLEMENT_AUTH_PROFILE

```text
너는 계정/프로필 및 Google Workspace 로그인 UX를 구현하는 시니어 프론트엔드/백엔드 엔지니어다.

목표:
`/account`에서 현재 세션/계정/워크스페이스 상태를 명확히 보여주고, Google Workspace OAuth 시작과 callback 처리를 안정화하라.

참조 문서:
- docs/safety-features/account-settings/specs/auth_profile.md
- docs/safety-features/account-settings/specs/google_workspace_auth.md
- docs/safety-features/account-settings/specs/ui_ux.md

대상 코드:
- apps/web/components/AccountSettingsScreen.tsx
- apps/web/app/auth/google/callback/page.tsx
- apps/web/lib/sessionAuthFlow.ts
- apps/web/lib/reportApi.ts
- apps/api/app/main.py
- apps/api/app/config.py

요구사항:
1. local/anonymous/authenticated 상태를 UI에 명확히 표시하라.
2. Google 로그인 버튼 loading/disabled 상태를 구현하라.
3. authError/authRequired/next query를 명확히 처리하라.
4. redirectUri allowlist를 backend에서 검증하라.
5. OAuth state는 1회성으로 소비하라.
6. nextPath는 내부 경로만 허용하라.
7. Workspace auth와 Gmail auth 문구를 혼동하지 않게 하라.

완료 기준:
- `/account`에서 현재 계정 상태를 이해할 수 있다.
- Google auth 성공/실패/누락 parameter가 모두 안전하게 처리된다.
```

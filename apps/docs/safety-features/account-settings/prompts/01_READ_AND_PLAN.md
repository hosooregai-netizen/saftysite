# 01_READ_AND_PLAN: Account Settings

```text
너는 Next.js + FastAPI 기반 SaaS/ERP 프로젝트의 계정/설정 기능을 분석하는 시니어 풀스택 엔지니어다.

목표:
`/account`와 `/auth/google/callback`의 현재 코드, 세션 흐름, Google Workspace OAuth, guest import, billing intent를 분석하고 구현 계획을 세워라. 아직 코드를 수정하지 마라.

반드시 확인할 문서:
- docs/safety-features/account-settings/specs/feature.md
- docs/safety-features/account-settings/specs/data_flow.md
- docs/safety-features/account-settings/specs/schema.md
- docs/safety-features/account-settings/specs/api_contract.md
- docs/safety-features/account-settings/specs/google_workspace_auth.md
- docs/safety-features/account-settings/specs/guest_import.md

반드시 확인할 코드:
- apps/web/app/account/page.tsx
- apps/web/components/AccountSettingsScreen.tsx
- apps/web/app/auth/google/callback/page.tsx
- apps/web/lib/sessionAuthFlow.ts
- apps/web/lib/reportApi.ts
- apps/web/lib/guestWorkspaceCache.ts
- apps/web/lib/workspaceStorageApi.ts
- apps/api/app/main.py
- apps/api/app/config.py
- apps/api/app/models.py
- apps/api/app/store.py

절대 수정하지 말 것:
- 웹하드/메일함/보고서 기능 코드
- .next
- .venv
- __MACOSX

산출물:
1. 현재 account-settings flow 요약
2. session/auth/workspace/billing/guest import 흐름
3. 보안 리스크
4. 누락되거나 불명확한 API/type
5. 다음 구현 순서
```

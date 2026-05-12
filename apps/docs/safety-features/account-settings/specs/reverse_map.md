# Reverse Map: Account Settings

## Route map

| Route | 역할 |
|---|---|
| `/account` | 계정/설정 화면 |
| `/auth/google/callback` | Google Workspace OAuth callback |
| `/billing/checkout` | 결제 진입 후속 route |
| `/mail/connect/google` | Google 메일 OAuth, mailbox 기능에서 관리 |

## Code map

| 흐름 | Frontend | Backend | Docs |
|---|---|---|---|
| 설정 화면 | `AccountSettingsScreen.tsx` | - | `ui_ux.md` |
| session 확인 | `reportApi.ts` | `/auth/me`, `/workspaces/me` | `session_state.md` |
| Google auth start | `sessionAuthFlow.ts` | `/auth/google/start` | `google_workspace_auth.md` |
| Google callback | `app/auth/google/callback/page.tsx` | `/auth/google/complete` | `google_workspace_auth.md` |
| anonymous claim | `sessionAuthFlow.ts` | `/auth/claim-anonymous` | `guest_import.md` |
| guest import | `workspaceStorageApi.ts` | `/workspaces/import-guest-cache` | `guest_import.md` |
| billing intent | `AccountSettingsScreen.tsx` | `/billing/checkout` | `billing_entry.md` |

## Prompt map

| Prompt | 목적 |
|---|---|
| `01_READ_AND_PLAN.md` | 현재 코드/문서 분석 |
| `02_SCHEMA_AND_API_PROMPT.md` | session/auth/workspace schema/API 정리 |
| `03_IMPLEMENT_AUTH_PROFILE.md` | 계정 상태와 Google auth UX 구현 |
| `04_IMPLEMENT_WORKSPACE_AND_GUEST_IMPORT.md` | workspace/guest import 구현 |
| `05_IMPLEMENT_BILLING_ENTRY.md` | 결제 진입 UX 구현 |
| `06_VISUAL_POLISH.md` | 설정 UI polish |
| `07_QA_REGRESSION.md` | 회귀 검증 |

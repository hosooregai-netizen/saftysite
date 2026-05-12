# Reverse Map: Auth Workspace

## Route map

| Route | 역할 |
|---|---|
| `/account` | 계정/워크스페이스/결제 진입 |
| `/auth/google/callback` | Google Workspace OAuth callback |
| `/api/v1/auth/*` | auth API |
| `/api/v1/workspaces/*` | workspace API |

## Code map

| 흐름 | Frontend | Backend | Specs |
|---|---|---|---|
| 계정 화면 | `AccountSettingsScreen.tsx` | auth/workspace APIs | `ui_ux.md` |
| Google auth start | `sessionAuthFlow.ts` | `/auth/google/start` | `google_workspace_auth.md` |
| Google callback | `app/auth/google/callback/page.tsx` | `/auth/google/complete` | `google_workspace_auth.md` |
| session 저장 | `reportApi.ts`, `authStorage` | token store | `token_storage.md` |
| anonymous auth | `reportApi.ts` | `/auth/anonymous` | `session_modes.md` |
| claim anonymous | `sessionAuthFlow.ts` | `/auth/claim-anonymous` | `anonymous_claim.md` |
| guest import | `guestWorkspaceCache.ts`, `workspaceStorageApi.ts` | `/workspaces/import-guest-cache` | `guest_import.md` |
| workspace access | feature API clients | `require_user`, `require_workspace_payload` | `workspace_access.md` |

## Related feature map

| 기능 | 의존 |
|---|---|
| webhard | workspace_id, user_id, permissions |
| mailbox | Workspace login + separate Gmail OAuth |
| report-workspace | report workspace access |
| photo-album | guest cache import + workspace storage |
| billing-credits | workspace credit ledger |
| headquarters-sites | workspace directory seed |

## Prompt map

| Prompt | 목적 |
|---|---|
| `01_READ_AND_PLAN.md` | 현재 auth/workspace 코드 분석 |
| `02_SCHEMA_AND_API_PROMPT.md` | schema/API 정리 |
| `03_IMPLEMENT_GOOGLE_WORKSPACE_AUTH.md` | Google Workspace auth 안정화 |
| `04_IMPLEMENT_WORKSPACE_ACCESS.md` | workspace guard 강화 |
| `05_IMPLEMENT_SESSION_AND_GUEST_CLAIM.md` | session/anonymous claim 안정화 |
| `06_IMPLEMENT_GUEST_IMPORT.md` | guest import 안정화 |
| `07_QA_REGRESSION.md` | 회귀 테스트 |

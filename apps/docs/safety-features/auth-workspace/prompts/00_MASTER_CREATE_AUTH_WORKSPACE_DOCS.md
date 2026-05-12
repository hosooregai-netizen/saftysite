# 00_MASTER_CREATE_AUTH_WORKSPACE_DOCS

```text
너는 Next.js + FastAPI 기반 SaaS/ERP 프로젝트의 인증/워크스페이스 문서를 작성하는 시니어 테크니컬 라이터이자 아키텍트다.

목표:
`docs/safety-features/auth-workspace/` 아래에 specs와 prompts를 분리한 문서 구조를 생성하라.

반드시 확인할 코드:
- apps/web/components/AccountSettingsScreen.tsx
- apps/web/app/auth/google/callback/page.tsx
- apps/web/lib/sessionAuthFlow.ts
- apps/web/lib/reportApi.ts
- apps/web/lib/guestWorkspaceCache.ts
- apps/web/lib/workspaceStorageApi.ts
- apps/api/app/main.py
- apps/api/app/models.py
- apps/api/app/config.py
- apps/api/app/store.py

생성할 specs:
- README.md
- feature.md
- user_flows.md
- data_flow.md
- schema.md
- api_contract.md
- session_modes.md
- google_workspace_auth.md
- anonymous_claim.md
- workspace_access.md
- token_storage.md
- guest_import.md
- ui_ux.md
- validation.md
- reverse_map.md
- test_scenarios.md
- code_inventory.md
- known_issues.md

생성할 prompts:
- 01_READ_AND_PLAN.md
- 02_SCHEMA_AND_API_PROMPT.md
- 03_IMPLEMENT_GOOGLE_WORKSPACE_AUTH.md
- 04_IMPLEMENT_WORKSPACE_ACCESS.md
- 05_IMPLEMENT_SESSION_AND_GUEST_CLAIM.md
- 06_IMPLEMENT_GUEST_IMPORT.md
- 07_QA_REGRESSION.md

중요 원칙:
- Workspace Google 로그인과 Gmail 메일 연결을 분리해서 문서화하라.
- session mode: authenticated / anonymous / local을 명확히 구분하라.
- guest cache import와 claim anonymous를 구분하라.
- 앱 코드는 수정하지 마라.
- .next, .venv, __MACOSX는 건드리지 마라.
```

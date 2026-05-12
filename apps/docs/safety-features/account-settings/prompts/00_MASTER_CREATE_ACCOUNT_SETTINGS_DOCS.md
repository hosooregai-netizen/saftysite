# Step 08 Master Prompt: Create account-settings docs

```text
너는 Next.js + FastAPI 기반 SaaS/ERP 프로젝트의 테크니컬 라이터이자 소프트웨어 아키텍트다.

목표:
`docs/safety-features/account-settings/` 아래에 계정/설정 기능의 specs와 prompts 구조를 생성하라.

대상 구조:
account-settings/
├─ README.md
├─ specs/
└─ prompts/

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

생성할 specs:
- README.md
- feature.md
- user_flows.md
- data_flow.md
- schema.md
- api_contract.md
- auth_profile.md
- google_workspace_auth.md
- workspace_membership.md
- guest_import.md
- billing_entry.md
- session_state.md
- ui_ux.md
- validation.md
- reverse_map.md
- test_scenarios.md
- code_inventory.md
- known_issues.md

생성할 prompts:
- 01_READ_AND_PLAN.md
- 02_SCHEMA_AND_API_PROMPT.md
- 03_IMPLEMENT_AUTH_PROFILE.md
- 04_IMPLEMENT_WORKSPACE_AND_GUEST_IMPORT.md
- 05_IMPLEMENT_BILLING_ENTRY.md
- 06_VISUAL_POLISH.md
- 07_QA_REGRESSION.md

문서 작성 원칙:
- specs는 명세와 구조만 작성한다.
- prompts는 Codex/구현 에이전트에게 바로 넣을 수 있는 실행 프롬프트로 작성한다.
- Google Workspace auth와 Gmail auth를 혼동하지 않게 분리한다.
- 결제 상세는 billing-credits 기능으로 분리하고, account-settings는 checkout 진입만 관리한다.
- 앱 코드는 수정하지 않는다.
- .next, .venv, __MACOSX는 건드리지 않는다.

완료 기준:
- account-settings/README.md만 봐도 기능 범위를 이해할 수 있다.
- specs/data_flow.md에서 /account와 /auth/google/callback 흐름을 이해할 수 있다.
- specs/guest_import.md에서 guest cache import 규칙을 이해할 수 있다.
- prompts/를 순서대로 실행하면 계정/설정 기능 개선 작업을 진행할 수 있다.
```

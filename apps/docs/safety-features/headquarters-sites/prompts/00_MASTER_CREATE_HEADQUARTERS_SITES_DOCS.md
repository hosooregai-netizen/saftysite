# Step 06 Master Prompt: Create headquarters-sites docs

```text
너는 Next.js + FastAPI 기반 기술지도 ERP 프로젝트의 테크니컬 라이터이자 소프트웨어 아키텍트다.

목표:
`docs/safety-features/headquarters-sites/` 아래에 사업장/현장 기준정보 기능의 specs와 prompts 구조를 생성하라.

대상 구조:
headquarters-sites/
├─ README.md
├─ specs/
└─ prompts/

반드시 확인할 코드:
- apps/web/app/headquarters/page.tsx
- apps/web/app/sites/page.tsx
- apps/web/components/HeadquartersHubScreen.tsx
- apps/web/components/SitesHubScreen.tsx
- apps/web/lib/safetyApi.ts
- apps/web/lib/safetyApi/adminEndpoints.ts
- apps/web/lib/admin/apiClient.ts
- apps/web/types/backend.ts
- apps/web/types/controller.ts
- apps/web/types/admin.ts
- apps/api/app/main.py
- apps/api/app/apps_stack.py
- apps/api/app/models.py
- apps/api/app/store.py

생성할 specs:
- README.md
- feature.md
- user_flows.md
- data_flow.md
- schema.md
- api_contract.md
- assignment.md
- directory_usage.md
- source_readiness.md
- ui_ux.md
- validation.md
- reverse_map.md
- test_scenarios.md
- code_inventory.md
- known_issues.md

생성할 prompts:
- 01_READ_AND_PLAN.md
- 02_SCHEMA_AND_API_PROMPT.md
- 03_IMPLEMENT_DIRECTORY_CRUD.md
- 04_IMPLEMENT_ASSIGNMENT.md
- 05_SOURCE_READINESS.md
- 06_VISUAL_POLISH.md
- 07_QA_REGRESSION.md

문서 작성 원칙:
- specs는 명세와 구조만 작성한다.
- prompts는 Codex/구현 에이전트에게 바로 넣을 수 있는 실행 프롬프트로 작성한다.
- 사업장/현장은 ERP AppShell 기준정보 관리 패턴을 유지한다.
- 웹하드/메일함처럼 full-screen shell로 바꾸지 않는다.
- 앱 코드는 수정하지 않는다.
- .next, .venv, __MACOSX는 건드리지 않는다.

완료 기준:
- feature.md만 봐도 기능 범위를 이해할 수 있다.
- schema.md와 api_contract.md만 보고 CRUD/assignment contract를 이해할 수 있다.
- source_readiness.md가 clean build 위험을 명확히 설명한다.
- prompts/를 순서대로 실행하면 기능 개선 작업을 진행할 수 있다.
```

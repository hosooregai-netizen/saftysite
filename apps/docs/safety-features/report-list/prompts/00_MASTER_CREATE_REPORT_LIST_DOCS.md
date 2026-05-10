# Step 05 Master Prompt: Create report-list docs

```text
너는 Next.js + FastAPI 기반 기술지도 보고서 목록 기능의 테크니컬 라이터이자 소프트웨어 아키텍트다.

목표:
`docs/safety-features/report-list/` 아래에 보고서 목록 기능의 specs와 prompts 구조를 생성하라.

대상 구조:
report-list/
├─ README.md
├─ specs/
└─ prompts/

반드시 확인할 코드:
- apps/web/app/reports/page.tsx
- apps/web/components/ReportsOverview.tsx
- apps/web/lib/reportApi.ts
- apps/api/app/main.py
- apps/api/app/models.py
- apps/api/app/store.py
- apps/api/app/apps_stack.py

연결해서 확인할 문서:
- docs/safety-features/report-workspace/specs/feature.md
- docs/safety-features/report-workspace/specs/schema.md
- docs/safety-features/report-workspace/specs/api_contract.md
- docs/safety-features/report-workspace/specs/reverse_map.md

생성할 specs:
- README.md
- feature.md
- user_flows.md
- data_flow.md
- schema.md
- api_contract.md
- list_filter_sort.md
- status_export.md
- ui_ux.md
- validation.md
- reverse_map.md
- test_scenarios.md
- code_inventory.md
- known_issues.md

생성할 prompts:
- 01_READ_AND_PLAN.md
- 02_SCHEMA_AND_API_PROMPT.md
- 03_IMPLEMENT_LIST_FILTER_SORT.md
- 04_IMPLEMENT_STATUS_EXPORT_BADGES.md
- 05_IMPLEMENT_REPORT_ACTIONS.md
- 06_VISUAL_POLISH.md
- 07_QA_REGRESSION.md

문서 작성 원칙:
- specs는 명세와 구조만 작성한다.
- prompts는 Codex/구현 에이전트에게 바로 넣을 수 있는 실행 프롬프트로 작성한다.
- report-workspace와 중복되는 내용은 연결만 하고, 목록 기능에 집중한다.
- 앱 코드는 수정하지 않는다.
- .next, .venv, __MACOSX는 건드리지 않는다.

완료 기준:
- report-list/README.md만 봐도 기능 범위를 이해할 수 있다.
- specs/data_flow.md에서 route → component → API → backend 흐름을 이해할 수 있다.
- specs/list_filter_sort.md에서 검색/필터/정렬 구현 기준을 확인할 수 있다.
- prompts/를 순서대로 실행하면 보고서 목록 개선 작업을 진행할 수 있다.
```

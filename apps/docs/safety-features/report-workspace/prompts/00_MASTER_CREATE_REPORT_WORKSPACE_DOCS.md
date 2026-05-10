# Step 04 Master Prompt: Create report-workspace docs

```text
너는 Next.js + FastAPI 기반 기술지도 결과보고서 자동작성 프로젝트의 테크니컬 라이터이자 소프트웨어 아키텍트다.

목표:
`docs/safety-features/report-workspace/` 아래에 보고서 작성/자동작성 기능의 specs와 prompts 구조를 생성하라.

중요:
기존 `apps/docs/technical-guidance-auto-report/` 문서는 삭제하거나 이동하지 말고, 새 문서에서 연결만 하라.

대상 구조:
report-workspace/
├─ README.md
├─ specs/
└─ prompts/

반드시 확인할 코드:
- apps/web/app/reports/new/page.tsx
- apps/web/app/reports/[reportId]/page.tsx
- apps/web/app/reports/page.tsx
- apps/web/components/ReportWorkspace.tsx
- apps/web/components/ReportWorkspaceScreen.tsx
- apps/web/components/ReportsOverview.tsx
- apps/web/lib/reportApi.ts
- apps/web/lib/reportImages.ts
- apps/web/lib/reportSessionMapper.ts
- apps/api/app/main.py
- apps/api/app/models.py
- apps/api/app/services/ai_pipeline.py
- apps/api/app/services/photo_observation_cards.py
- apps/api/app/services/standard_risk_library.py
- apps/api/app/services/standard_report_composer.py
- apps/api/app/services/credits.py

반드시 확인할 기존 문서:
- apps/docs/technical-guidance-auto-report/README.md
- apps/docs/technical-guidance-auto-report/00_index.md
- apps/docs/technical-guidance-auto-report/01_step_site_schedule_seed.md
- apps/docs/technical-guidance-auto-report/02_step_minimal_photo_upload.md
- apps/docs/technical-guidance-auto-report/03_step_photo_observation_card.md
- apps/docs/technical-guidance-auto-report/04_step_risk_library_matching.md
- apps/docs/technical-guidance-auto-report/05_step_section_composer.md
- apps/docs/technical-guidance-auto-report/06_step_review_validation.md
- apps/docs/technical-guidance-auto-report/07_step_render_export_dispatch.md
- apps/docs/technical-guidance-auto-report/90_codex_prompts.md
- apps/docs/technical-guidance-auto-report/PROMPT_SEQUENCE.md
- apps/docs/technical-guidance-auto-report/reference/standard_report_structure.md

생성할 specs:
- README.md
- feature.md
- user_flows.md
- data_flow.md
- schema.md
- api_contract.md
- guided_upload.md
- ai_generation.md
- review_validation.md
- export_dispatch.md
- auto_report_existing_docs.md
- ui_ux.md
- validation.md
- reverse_map.md
- test_scenarios.md
- code_inventory.md
- known_issues.md

생성할 prompts:
- 01_READ_AND_PLAN.md
- 02_SCHEMA_AND_DATA_FLOW_PROMPT.md
- 03_IMPLEMENT_GUIDED_UPLOAD_PROMPT.md
- 04_IMPLEMENT_AI_GENERATION_PROMPT.md
- 05_IMPLEMENT_REVIEW_VALIDATION_PROMPT.md
- 06_IMPLEMENT_EXPORT_DISPATCH_PROMPT.md
- 07_QA_REGRESSION.md

문서 작성 원칙:
- specs는 명세와 구조만 작성한다.
- prompts는 Codex/구현 에이전트에게 바로 넣을 수 있는 실행 프롬프트로 작성한다.
- 기존 technical-guidance-auto-report 문서를 새 구조로 복사하지 말고 map으로 연결한다.
- 앱 코드는 수정하지 않는다.
- .next, .venv, __MACOSX는 건드리지 않는다.

완료 기준:
- report-workspace/README.md만 봐도 기능 범위를 이해할 수 있다.
- specs/data_flow.md에서 route → component → API → backend service 흐름을 이해할 수 있다.
- specs/auto_report_existing_docs.md에서 기존 문서와 새 문서의 연결을 확인할 수 있다.
- prompts/를 순서대로 실행하면 보고서 기능 개선 작업을 진행할 수 있다.
```

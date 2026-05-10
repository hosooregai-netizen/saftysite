# 01_READ_AND_PLAN: Report Workspace

```text
너는 Next.js + FastAPI 기반 기술지도 보고서 자동작성 기능을 문서화/개선하는 시니어 풀스택 엔지니어다.

목표:
보고서 작성 워크스페이스의 현재 코드와 기존 자동작성 문서를 읽고, 구현/문서화 계획을 세워라. 아직 코드를 수정하지 마라.

반드시 확인할 문서:
- docs/safety-features/report-workspace/specs/feature.md
- docs/safety-features/report-workspace/specs/data_flow.md
- docs/safety-features/report-workspace/specs/schema.md
- docs/safety-features/report-workspace/specs/api_contract.md
- docs/safety-features/report-workspace/specs/auto_report_existing_docs.md
- apps/docs/technical-guidance-auto-report/00_index.md
- apps/docs/technical-guidance-auto-report/PROMPT_SEQUENCE.md

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

절대 수정하지 말 것:
- 앱 코드
- .next
- .venv
- __MACOSX
- 기존 technical-guidance-auto-report 문서

산출물:
1. 현재 route/component/API 흐름 요약
2. 기존 자동작성 문서와 현재 코드의 차이
3. 우선 수정/보강해야 할 영역
4. 리스크
5. 다음 단계 구현 계획
```

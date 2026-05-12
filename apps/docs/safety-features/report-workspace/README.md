# report-workspace

기술지도 결과보고서 작성/검토/출력 워크스페이스 기능 문서다.

이 기능은 `/reports/new`에서 현장/사진/기본 정보를 수집하고, `/reports/[reportId]`에서 AI 초안 검토, 항목 수정, 검토 완료, PDF/HWPX 출력까지 이어지는 보고서 작성의 핵심 기능이다.

## 문서 구조

```text
report-workspace/
├─ specs/
│  ├─ feature.md
│  ├─ user_flows.md
│  ├─ data_flow.md
│  ├─ schema.md
│  ├─ api_contract.md
│  ├─ guided_upload.md
│  ├─ ai_generation.md
│  ├─ review_validation.md
│  ├─ export_dispatch.md
│  ├─ auto_report_existing_docs.md
│  ├─ ui_ux.md
│  ├─ validation.md
│  ├─ reverse_map.md
│  ├─ test_scenarios.md
│  ├─ code_inventory.md
│  └─ known_issues.md
└─ prompts/
   ├─ 01_READ_AND_PLAN.md
   ├─ 02_SCHEMA_AND_DATA_FLOW_PROMPT.md
   ├─ 03_IMPLEMENT_GUIDED_UPLOAD_PROMPT.md
   ├─ 04_IMPLEMENT_AI_GENERATION_PROMPT.md
   ├─ 05_IMPLEMENT_REVIEW_VALIDATION_PROMPT.md
   ├─ 06_IMPLEMENT_EXPORT_DISPATCH_PROMPT.md
   └─ 07_QA_REGRESSION.md
```

## 핵심 원칙

- 기존 `apps/docs/technical-guidance-auto-report/` 문서는 삭제하거나 이동하지 않는다.
- 새 `docs/safety-features/report-workspace/` 문서는 기존 자동작성 문서와 현재 코드 사이의 연결 맵 역할을 한다.
- 보고서 기능은 웹하드/메일함처럼 full-screen shell보다 ERP AppShell + report workspace 흐름에 가깝다.
- AI 초안 생성, 사진 증거, 검토 완료, 출력/과금/메일 발송은 모두 추적 가능한 단계로 문서화한다.

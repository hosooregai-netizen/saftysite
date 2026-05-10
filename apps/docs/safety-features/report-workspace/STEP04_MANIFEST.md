# Step 04: report-workspace specs/prompts

이번 단계는 `docs/safety-features/report-workspace/` 구조를 생성한다.

## 목적

보고서 작성/자동작성 기능을 `specs/`와 `prompts/`로 분리한다.

```text
report-workspace/
├─ specs/
└─ prompts/
```

## 핵심 범위

- `/reports/new`
- `/reports/[reportId]`
- `/reports`
- guided photo upload
- AI draft generation
- review queue / validation
- PDF/HWPX export
- credit / export history
- 기존 `apps/docs/technical-guidance-auto-report/` 문서 연결

## 생성 파일

```text
docs/safety-features/report-workspace/
├─ README.md
├─ specs/
│  ├─ README.md
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

## 다음 단계 추천

Step 05는 `report-list` 또는 `headquarters-sites`가 좋다.  
보고서 기능 흐름을 이어가려면 `report-list`가 자연스럽고, 데이터 기준정보를 먼저 잡으려면 `headquarters-sites`가 좋다.

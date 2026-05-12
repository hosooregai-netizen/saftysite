# Step 05: report-list specs/prompts

이번 단계는 `docs/safety-features/report-list/` 구조를 생성한다.

## 목적

보고서 목록 기능을 `specs/`와 `prompts/`로 분리한다.

```text
report-list/
├─ specs/
└─ prompts/
```

## 핵심 범위

- `/reports`
- `ReportsOverview`
- `listReports`
- `GET /api/v1/reports`
- local/generated/server report merge
- status badge
- export status
- 검색/필터/정렬
- row click / keyboard navigation
- empty/loading/error state

## 생성 파일

```text
docs/safety-features/report-list/
├─ README.md
├─ specs/
│  ├─ README.md
│  ├─ feature.md
│  ├─ user_flows.md
│  ├─ data_flow.md
│  ├─ schema.md
│  ├─ api_contract.md
│  ├─ list_filter_sort.md
│  ├─ status_export.md
│  ├─ ui_ux.md
│  ├─ validation.md
│  ├─ reverse_map.md
│  ├─ test_scenarios.md
│  ├─ code_inventory.md
│  └─ known_issues.md
└─ prompts/
   ├─ 01_READ_AND_PLAN.md
   ├─ 02_SCHEMA_AND_API_PROMPT.md
   ├─ 03_IMPLEMENT_LIST_FILTER_SORT.md
   ├─ 04_IMPLEMENT_STATUS_EXPORT_BADGES.md
   ├─ 05_IMPLEMENT_REPORT_ACTIONS.md
   ├─ 06_VISUAL_POLISH.md
   └─ 07_QA_REGRESSION.md
```

## 다음 단계 추천

Step 06은 `headquarters-sites`가 좋다.  
보고서 목록과 보고서 작성이 결국 사업장/현장 기준정보에 의존하기 때문에, 기준정보 명세를 먼저 잡으면 이후 사진첩/메일/보고서 연계가 쉬워진다.

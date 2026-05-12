# report-list

보고서 목록 기능 문서다.

이 기능은 `/reports`에서 작성 중인 보고서, 검토 완료 보고서, 출력 완료 보고서를 한 화면에서 조회하고, 새 보고서 작성 또는 기존 보고서 검토 화면으로 이동하게 한다.

## 문서 구조

```text
report-list/
├─ specs/
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

## 관련 기능

- `report-workspace`: 보고서 작성/검토/출력 상세 화면
- `headquarters-sites`: 사업장/현장 기준정보
- `mailbox`: 보고서 발송 연계
- `billing-credits`: export credit 정책

# headquarters-sites

사업장/현장 기준정보 관리 기능 문서다.

이 기능은 보고서 작성, 보고서 목록, 사진첩, 웹하드/메일 연계의 기준이 되는 `건설사/사업장(headquarter)`과 `현장(site)` 데이터를 관리한다.

## 문서 구조

```text
headquarters-sites/
├─ specs/
│  ├─ feature.md
│  ├─ user_flows.md
│  ├─ data_flow.md
│  ├─ schema.md
│  ├─ api_contract.md
│  ├─ assignment.md
│  ├─ directory_usage.md
│  ├─ source_readiness.md
│  ├─ ui_ux.md
│  ├─ validation.md
│  ├─ reverse_map.md
│  ├─ test_scenarios.md
│  ├─ code_inventory.md
│  └─ known_issues.md
└─ prompts/
   ├─ 01_READ_AND_PLAN.md
   ├─ 02_SCHEMA_AND_API_PROMPT.md
   ├─ 03_IMPLEMENT_DIRECTORY_CRUD.md
   ├─ 04_IMPLEMENT_ASSIGNMENT.md
   ├─ 05_SOURCE_READINESS.md
   ├─ 06_VISUAL_POLISH.md
   └─ 07_QA_REGRESSION.md
```

## 핵심 원칙

- 보고서 작성의 기준정보는 headquarter/site에서 출발한다.
- `/sites`는 독립 화면보다 `/headquarters?scope=assigned`로 redirect되는 entry route로 관리한다.
- 사업장/현장 데이터는 workspace 단위로 격리한다.
- 배정 assignment는 사용자가 볼 수 있는 사업장/현장의 범위를 결정한다.

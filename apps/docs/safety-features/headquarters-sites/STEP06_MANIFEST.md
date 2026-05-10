# Step 06: headquarters-sites specs/prompts

이번 단계는 `docs/safety-features/headquarters-sites/` 구조를 생성한다.

## 목적

사업장/현장 기준정보 기능을 `specs/`와 `prompts/`로 분리한다.

```text
headquarters-sites/
├─ specs/
└─ prompts/
```

## 핵심 범위

- `/headquarters`
- `/sites` redirect
- 사업장 CRUD
- 현장 CRUD
- 사용자별 현장/사업장 배정
- 보고서 작성 seed
- 사진첩 필터 연계
- clean build source readiness

## 생성 파일

```text
docs/safety-features/headquarters-sites/
├─ README.md
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

## 다음 단계 추천

Step 07은 `photo-album`이 좋다. 사업장/현장 기준정보와 가장 직접적으로 연결되고, 보고서 사진 증거와도 이어진다.

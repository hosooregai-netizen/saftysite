# photo-album

사진첩은 현장 사진을 사업장/현장/회차 기준으로 보관하고 조회하는 기능이다.

이 기능은 `/photo-album` route에서 동작하며, 보고서 작성의 사진 증거 흐름과 사업장/현장 기준정보를 연결한다. 로그인 사용자는 서버 사진첩을 사용하고, 비로그인/임시 사용자는 guest workspace cache에 사진을 임시 보관한다.

## 문서 구조

```text
photo-album/
├─ specs/
│  ├─ feature.md
│  ├─ user_flows.md
│  ├─ data_flow.md
│  ├─ schema.md
│  ├─ api_contract.md
│  ├─ album_filters.md
│  ├─ photo_evidence_linking.md
│  ├─ guest_cache.md
│  ├─ source_readiness.md
│  ├─ ui_ux.md
│  ├─ validation.md
│  ├─ reverse_map.md
│  ├─ test_scenarios.md
│  ├─ code_inventory.md
│  └─ known_issues.md
└─ prompts/
   ├─ 01_READ_AND_PLAN.md
   ├─ 02_SOURCE_READINESS.md
   ├─ 03_SCHEMA_AND_API_PROMPT.md
   ├─ 04_IMPLEMENT_PHOTO_GRID.md
   ├─ 05_IMPLEMENT_FILTERS_AND_LINKING.md
   ├─ 06_VISUAL_POLISH.md
   └─ 07_QA_REGRESSION.md
```

## 핵심 원칙

- 사진첩은 ERP AppShell 안의 기준/자료 관리 화면이다.
- 웹하드처럼 Drive shell로 바꾸지 않는다.
- 사업장/현장 기준정보와 연결되어야 한다.
- 보고서 작성의 사진 증거와 연결 가능해야 한다.
- 비로그인 상태에서는 guest cache 임시 보관을 지원한다.

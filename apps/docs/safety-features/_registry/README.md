# Registry

`_registry/`는 기능, route, API, schema, prompt, reverse map을 한곳에서 추적하기 위한 색인이다.

| 파일 | 역할 |
|---|---|
| `feature_registry.md` | 기능별 priority, route, layout, 문서 상태 |
| `route_registry.md` | route → feature → component 연결 |
| `api_registry.md` | API endpoint → feature → backend 연결 |
| `schema_registry.md` | 데이터 모델 → feature 연결 |
| `prompt_registry.md` | 기능별 prompt 실행 순서 |
| `reverse_registry.md` | feature → route → file → API → schema → prompt 역추적 |
| `doc_status_registry.md` | 문서 작성 단계와 누락 항목 추적 |
| `cross_feature_registry.md` | 기능 간 의존성 |
| `known_issue_registry.md` | 공통 known issue 색인 |

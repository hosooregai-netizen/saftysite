# Reverse Guide

## 특정 기능을 리버스하는 순서

1. `_registry/feature_registry.md`에서 기능 slug 확인
2. `_registry/route_registry.md`에서 route 확인
3. 기능 `specs/README.md` 읽기
4. 기능 `specs/feature.md` 읽기
5. 기능 `specs/data_flow.md` 읽기
6. 기능 `specs/schema.md`와 `api_contract.md` 읽기
7. 기능 `specs/reverse_map.md`에서 코드/API/prompt 연결 확인
8. 기능 `prompts/01_READ_AND_PLAN.md` 실행
9. 필요한 구현 prompt 실행
10. 기능 `specs/test_scenarios.md`로 QA

## 전체 프로젝트를 리버스하는 순서

```text
README.md
→ INDEX.md
→ DOCUMENTATION_RULES.md
→ _registry/feature_registry.md
→ _registry/route_registry.md
→ _registry/reverse_registry.md
→ _project/specs/code_map.md
→ 기능별 specs
→ 기능별 prompts
```

## 결과 검증

- 모든 P0 기능에 `specs/`와 `prompts/`가 있어야 한다.
- 모든 route는 feature에 연결되어야 한다.
- 모든 prompt는 QA prompt로 끝나야 한다.
- 모든 API 변경은 api_contract와 api_registry에 반영되어야 한다.

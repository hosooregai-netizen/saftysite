# 03_VALIDATE_REVERSE_MAPS

```text
너는 프로젝트 reverse map을 검증하는 소프트웨어 아키텍트다.

목표:
기능별 reverse_map.md와 `_registry/reverse_registry.md`가 최신 코드/API/schema/prompt와 일치하는지 검증하라.

검사 대상:
- docs/safety-features/*/specs/reverse_map.md
- docs/safety-features/_registry/reverse_registry.md
- docs/safety-features/_registry/route_registry.md
- docs/safety-features/_registry/api_registry.md
- docs/safety-features/_registry/schema_registry.md

요구사항:
1. reverse_map에 route가 누락되지 않았는지 확인하라.
2. frontend component 경로가 실제 존재하는지 확인하라.
3. backend API/service 경로가 실제 존재하는지 확인하라.
4. schema_registry와 기능 schema.md가 충돌하지 않는지 확인하라.
5. prompt_registry와 실제 prompts 폴더가 일치하는지 확인하라.
6. 불일치 사항을 수정하거나 known issue로 기록하라.

완료 기준:
- feature → route → component → API → schema → prompt 연결이 추적 가능하다.
```

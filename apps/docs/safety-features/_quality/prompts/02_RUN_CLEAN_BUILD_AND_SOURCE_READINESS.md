# 02_RUN_CLEAN_BUILD_AND_SOURCE_READINESS

```text
너는 clean build/source readiness를 담당하는 시니어 QA 엔지니어다.

목표:
`.next` 캐시를 삭제한 source tree 기준으로 frontend build를 검증하라.

참조 문서:
- docs/safety-features/_quality/specs/qa_matrix.md
- docs/safety-features/_quality/specs/release_gate.md
- docs/safety-features/_registry/*
- docs/safety-features/*/specs/test_scenarios.md

절대 수정하지 말 것:
- 앱 소스 코드
- .next
- .venv
- __MACOSX

산출물:
build failure 분류, 누락 source file 목록, release blocking 여부

완료 기준:
결과를 기능별로 분류하고, release blocking 여부를 명확히 표시한다.
```

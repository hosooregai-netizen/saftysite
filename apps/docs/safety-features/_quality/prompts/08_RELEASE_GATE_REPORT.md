# 08_RELEASE_GATE_REPORT

```text
너는 release gate report를 담당하는 시니어 QA 엔지니어다.

목표:
clean build, route smoke, security, visual, docs coverage 결과를 종합해 release 가능 여부를 판단하라.

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
release / hold decision, blockers, non-blocking known issues

완료 기준:
결과를 기능별로 분류하고, release blocking 여부를 명확히 표시한다.
```

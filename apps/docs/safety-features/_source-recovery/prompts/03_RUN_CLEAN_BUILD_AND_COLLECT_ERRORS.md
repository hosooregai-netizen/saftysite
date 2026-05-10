# 03_RUN_CLEAN_BUILD_AND_COLLECT_ERRORS

```text
너는 Source Recovery QA를 수행하는 시니어 엔지니어다.

목표:
clean build를 실행하고 오류 로그를 수집하라.

참조 문서:
- docs/safety-features/_source-recovery/specs/build_qa.md
- docs/safety-features/_source-recovery/specs/remaining_error_triage.md
- docs/safety-features/_source-recovery/specs/route_smoke_after_recovery.md
- docs/safety-features/_quality/specs/source_recovery_build_gate.md

절대 수정하지 말 것:
- .next
- .venv
- __MACOSX

산출물:
build 결과, 오류 목록, 기능별 분류

완료 기준:
다음 단계가 source patch인지 feature hardening인지 판단할 수 있다.
```

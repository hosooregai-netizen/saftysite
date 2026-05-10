# 06_ROUTE_SMOKE_AFTER_RECOVERY

```text
너는 Source Recovery QA를 수행하는 시니어 엔지니어다.

목표:
source recovery 후 주요 route smoke를 수행하라.

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
route별 pass/fail과 상태 메시지

완료 기준:
다음 단계가 source patch인지 feature hardening인지 판단할 수 있다.
```

# 10_COLLECT_RC_QA_RESULTS

```text
너는 release candidate 문서와 QA 결과를 정리하는 시니어 QA 엔지니어다.

목표:
Step 26 QA 결과를 수집하고 rc_result_intake 형식으로 정리하라.

참조 문서:
- docs/safety-features/_release-candidate/specs/rc_result_intake.md
- docs/safety-features/_release-candidate/specs/release_blocker_severity_matrix.md
- docs/safety-features/_release-candidate/specs/blocker_owner_mapping.md
- docs/safety-features/_release-candidate/specs/release_decision_report_template.md
- docs/safety-features/_quality/specs/release_decision_gate.md

절대 수정하지 말 것:
- 앱 소스 코드
- .next
- .venv
- __MACOSX

산출물:
1. 결과 요약
2. blocker 또는 known issue 목록
3. owner
4. release decision 영향
5. 다음 action

완료 기준:
다음 사람이 바로 patch 또는 release를 진행할 수 있을 정도로 결정이 명확하다.
```

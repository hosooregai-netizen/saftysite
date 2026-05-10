# Service Improvement 16 Prompt: RC Manual QA & Blocker Tracking

```text
너는 service improvements 01~15가 적용된 release candidate를 수동 QA하고 release decision을 준비하는 QA lead다.

목표:
build 결과, route smoke, 기능별 gate를 수집하고 blocker tracker와 release decision을 작성하라.

전제:
- service_improvements_01_to_15_apply_overlay.zip이 적용되어 있다.
- bash scripts/service-improvements/run-final-qa.sh를 실행했다.
- frontend-build.log와 backend-compile.log가 생성되어 있다.

실행:
bash scripts/service-improvements/create-rc-qa-report.sh

수동 확인:
- docs/service-improvements/16-rc-manual-qa-blocker-tracking/RC_MANUAL_QA_RUNBOOK.md
- docs/service-improvements/16-rc-manual-qa-blocker-tracking/ROUTE_SMOKE_RESULTS_TEMPLATE.md
- docs/service-improvements/16-rc-manual-qa-blocker-tracking/BLOCKER_TRACKER_TEMPLATE.md
- docs/service-improvements/16-rc-manual-qa-blocker-tracking/RELEASE_DECISION_TEMPLATE.md

중점:
1. build/compile 결과를 확인하라.
2. route smoke 결과를 기록하라.
3. mailbox state contradiction이 없는지 확인하라.
4. webhard Drive-like layout과 public share boundary를 확인하라.
5. report export gate와 billing idempotency를 확인하라.
6. Workspace Google login과 Gmail connect가 분리되어 있는지 확인하라.
7. guest import 중복 방지를 확인하라.
8. blocker를 S0~S4로 분류하라.
9. release / hold / conditional release 결정을 작성하라.

완료 기준:
- RC_QA_REPORT.md 작성
- ROUTE_SMOKE_RESULTS.md 작성
- BLOCKER_TRACKER.md 작성
- RELEASE_DECISION.md 작성
```

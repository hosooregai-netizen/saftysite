# Service Improvement 16: RC Manual QA & Blocker Tracking

## 목적

15단계에서 clean build와 backend compile을 실행한 뒤, 실제 사람이 확인해야 하는 route smoke와 기능별 gate를 기록하고 release / hold 결정을 내리는 단계다.

이번 단계는 source patch가 아니라 **QA 결과 수집 + blocker tracking + release decision 문서 패키지**다.

## 언제 사용하나

```text
1. service_improvements_01_to_15_apply_overlay.zip 적용
2. service_improvement_15_final_build_route_smoke_qa_overlay.zip 적용
3. bash scripts/service-improvements/run-final-qa.sh 실행
4. build/compile 결과 확인
5. 이 16단계로 route smoke와 blocker를 기록
```

## 포함 문서

```text
README.md
RC_MANUAL_QA_RUNBOOK.md
ROUTE_SMOKE_RESULTS_TEMPLATE.md
BLOCKER_TRACKER_TEMPLATE.md
RELEASE_DECISION_TEMPLATE.md
SERVICE_IMPROVEMENT_16_PROMPT.md
```

## 포함 스크립트

```text
scripts/service-improvements/create-rc-qa-report.sh
```

이 스크립트는 QA report 초안을 생성한다.

```bash
bash scripts/service-improvements/create-rc-qa-report.sh
```

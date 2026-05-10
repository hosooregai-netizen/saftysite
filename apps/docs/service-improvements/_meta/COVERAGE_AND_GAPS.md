# Coverage & Gaps

## 이번 v2에서 보강한 부족한 점

기존 01~15 개별 문서는 각 단계 설명은 있었지만, 전체를 한눈에 이해하고 적용하기 위한 공통 문서가 부족했다. 이번 ZIP에서 아래를 보강했다.

| 부족했던 점 | 보강 문서 |
|---|---|
| 전체 구조 설명 부족 | `00-overview/STRUCTURE_OVERVIEW.md` |
| 적용 순서 분산 | `_meta/APPLY_ORDER.md` |
| 단계별 변경 파일 map 부족 | `_meta/FILES_CHANGED_BY_STEP.md` |
| build/route QA를 한 문서에서 보기 어려움 | `_qa/FINAL_QA_RUNBOOK.md`, `_qa/ROUTE_SMOKE_CHECKLIST.md` |
| blocker 대응 템플릿 부족 | `_blocker-patches/BLOCKER_PATCH_TEMPLATE.md` |
| rollback 기준 부족 | `_rollback/ROLLBACK_GUIDE.md` |
| AI 에이전트 실행 순서 부족 | `_prompts/MASTER_AGENT_RUNBOOK.md` |
| 인수인계용 요약 부족 | `_handoff/HANDOFF_GUIDE.md` |

## 아직 실제 적용 후 확인해야 하는 점

이 문서 ZIP만으로는 실제 build 성공 여부를 보장하지 않는다. 실제 프로젝트에 overlay를 적용한 뒤 아래를 확인해야 한다.

```bash
rm -rf apps/web/.next
cd apps/web
npm run build

cd ../api
python -m compileall app
```

## 실제 build 결과에 따른 다음 단계

| 결과 | 다음 작업 |
|---|---|
| build 실패 | remaining build error patch |
| build 성공, route smoke 실패 | route-specific blocker patch |
| route smoke 통과, 보안 gate 실패 | security blocker patch |
| 전체 통과 | release candidate decision |

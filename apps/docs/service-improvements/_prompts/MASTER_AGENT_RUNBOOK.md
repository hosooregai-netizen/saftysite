# Master Agent Runbook

AI/Codex 에이전트에게 작업시킬 때는 아래 순서를 사용한다.

## 1. 적용 전 분석

```text
전체 docs/service-improvements/README.md를 읽어라.
_meta/APPLY_ORDER.md를 읽어라.
변경하려는 step의 README.md와 QA_CHECKLIST.md를 읽어라.
앱 코드는 아직 수정하지 말고 적용 계획을 작성하라.
```

## 2. Overlay 적용

```text
service_improvements_01_to_15_apply_overlay.zip을 프로젝트 루트에 적용하라.
충돌 파일이 있으면 충돌 내용을 요약하라.
```

## 3. Build QA

```text
bash scripts/service-improvements/run-final-qa.sh를 실행하라.
실패하면 frontend-build.log와 backend-compile.log를 요약하라.
```

## 4. Blocker patch

```text
_blocker-patches/BLOCKER_PATCH_TEMPLATE.md 형식으로 blocker를 작성하라.
최소 범위 patch를 작성하라.
focused QA와 related regression을 실행하라.
```

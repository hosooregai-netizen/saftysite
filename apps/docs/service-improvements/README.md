# Service Improvements 01~15

이 문서 묶음은 현재 서비스 개선을 실제 코드에 적용하기 위한 **개선 단계별 명세 + 적용 가이드 + 실행 프롬프트 + QA 체크리스트**다.

기본 원칙은 다음과 같다.

```text
각 개선 단계/
├─ README.md              # 개선 목적과 포함 파일
├─ APPLY_GUIDE.md          # 적용 순서가 있는 경우
├─ QA_CHECKLIST.md         # build, route, 기능 QA
└─ *_PROMPT.md             # Codex/AI 구현 에이전트 실행 프롬프트
```

## 바로 시작

1. `00-overview/STRUCTURE_OVERVIEW.md`로 전체 구조를 이해한다.
2. `_meta/APPLY_ORDER.md`의 순서대로 overlay를 적용한다.
3. `15-final-build-route-smoke-qa/README.md`와 `_qa/FINAL_QA_RUNBOOK.md`로 build와 route smoke를 실행한다.
4. 실패하면 `_blocker-patches/BLOCKER_PATCH_TEMPLATE.md`로 blocker patch를 만든다.

## 중요한 구분

이 ZIP은 **마크다운 문서만** 포함한다. 실제 source overlay는 별도 ZIP인 `service_improvements_01_to_15_apply_overlay.zip`을 적용해야 한다.

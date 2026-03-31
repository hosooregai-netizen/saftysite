# ERP Session Prompt Pack

## Purpose

- Keep parallel ERP work isolated by repo, branch, and worktree.
- Apply the missing operating rules to the existing session 1-8 prompts.
- Add the previously suggested session 9-12 prompts in copy-paste form.
- Make the handoff runnable without switching to plan mode.

## Repos And Source Material

- Client repo: `c:\Users\정호수\Desktop\safty\한종안`
- Server repo: `c:\Users\정호수\Desktop\safty\server`
- Transcript: `c:\Users\정호수\Documents\카카오톡 받은 파일\통화 녹음 기빈이형_260330_223013_original.txt`

## Fast Start

1. Run `powershell -ExecutionPolicy Bypass -File .\scripts\setup-erp-worktrees.ps1 -Preset Full12` from the client repo.
2. Paste the matching session prompt into one Codex full access session per worktree.
3. Do not push directly to `origin/main` from parallel sessions.
4. Use session 9 as the only merge-to-main session after the parallel work is done.

## Recommended Wave Order

- Wave 1 parallel: session 1, 2, 3, 4, 7
- Wave 2 parallel after wave 1: session 5, 10, 11, 12
- Wave 3 after product flow stabilizes: session 6, 8
- Final integration only after all relevant branches are ready: session 9

## Common Rules Block

Append this block to every session prompt, including the original session 1-8 prompts.

```text
공통 작업 규칙:
- 이 세션은 자신의 전용 worktree/branch에서만 작업하세요.
- 작업 시작 전에 git status와 현재 branch를 확인하세요.
- 다른 세션이 건드릴 수 있는 파일을 임의로 되돌리거나 정리하지 마세요.
- 소유 범위를 벗어나는 수정은 가능한 한 피하고, 꼭 필요하면 최소 범위로만 하세요.
- 관련 없는 포맷팅, 대규모 리네임, import 정렬-only 변경은 금지합니다.
- 클라이언트와 서버를 둘 다 수정하는 경우 커밋과 push는 리포지토리별로 분리하세요.
- 병렬 세션은 origin/main에 직접 push하지 말고 세션 전용 branch까지만 올리거나 push 없이 종료하세요.
- 마지막 보고 형식은 반드시 다음 순서를 지키세요:
  1. 변경 요약
  2. 테스트 결과
  3. 충돌 가능 파일
  4. 다음 통합 세션이 볼 포인트
```

## Session Map

| Session | Repo | Branch | Worktree |
| --- | --- | --- | --- |
| 1 | client | `erp/session-01-docs-gap-analysis` | `c:\Users\정호수\Desktop\safty\worktrees\hanjongan-s01-docs` |
| 2 | client | `erp/session-02-worker-entry` | `c:\Users\정호수\Desktop\safty\worktrees\hanjongan-s02-worker-entry` |
| 3 | client | `erp/session-03-report-authoring` | `c:\Users\정호수\Desktop\safty\worktrees\hanjongan-s03-report-authoring` |
| 4 | client | `erp/session-04-admin-kpi` | `c:\Users\정호수\Desktop\safty\worktrees\hanjongan-s04-admin-kpi` |
| 5 | client | `erp/session-05-cache-loading` | `c:\Users\정호수\Desktop\safty\worktrees\hanjongan-s05-cache-loading` |
| 6 | client | `erp/session-06-smoke` | `c:\Users\정호수\Desktop\safty\worktrees\hanjongan-s06-smoke` |
| 7 | client | `erp/session-07-benchmark` | `c:\Users\정호수\Desktop\safty\worktrees\hanjongan-s07-benchmark` |
| 8 | server | `erp/session-08-api-audit` | `c:\Users\정호수\Desktop\safty\worktrees\server-s08-api-audit` |
| 9 | client | `erp/session-09-merge` | `c:\Users\정호수\Desktop\safty\worktrees\hanjongan-s09-merge` |
| 10 | client | `erp/session-10-microcopy` | `c:\Users\정호수\Desktop\safty\worktrees\hanjongan-s10-microcopy` |
| 11 | client | `erp/session-11-ux-a11y` | `c:\Users\정호수\Desktop\safty\worktrees\hanjongan-s11-ux-a11y` |
| 12 | client | `erp/session-12-qa-docs` | `c:\Users\정호수\Desktop\safty\worktrees\hanjongan-s12-qa-docs` |

## Session 9

```text
Full access mode로 바로 작업하세요. Plan mode는 쓰지 말고, 각 병렬 세션의 branch/worktree 결과를 읽고 최종 통합까지 끝내세요.

작업 위치:
- integration repo: c:\Users\정호수\Desktop\safty\worktrees\hanjongan-s09-merge

입력:
- 세션 2, 3, 4, 5, 6 결과 branch
- 필요 시 세션 1, 7, 10, 11, 12 문서/UX 결과도 반영

목표:
- 병렬 작업 결과를 충돌 없이 통합
- ERP 관련 핵심 흐름이 함께 동작하는지 최종 점검
- 중복 UI, 라우팅 충돌, 타입 충돌, stale import, dead code를 정리
- 최종적으로만 origin/main 반영

구체 작업:
- 각 세션 변경 내용을 먼저 읽고 의도와 충돌 지점을 정리
- worker 진입 흐름, quarterly/bad-workplace 작성 흐름, admin KPI 보강, cache/loading 수정이 서로 충돌하지 않게 통합
- 동일 목적의 중복 컴포넌트/헬퍼가 생겼으면 하나로 정리
- lint/build 통과가 목표이며, 필요 시 최소 리팩터링 허용
- 문서와 테스트도 최종 결과에 맞게 조정

검증:
- npm run lint
- npm run build
- 가능하면 smoke 관련 스크립트 실행
- 핵심 라우트 수동 점검

마무리:
- 최종 통합 커밋
- 예시 메시지: chore(erp): integrate parallel workflow changes
- 이 세션만 origin/main에 push
- 마지막에 충돌 해결 포인트와 남은 리스크를 짧게 보고

공통 작업 규칙:
- 이 세션은 자신의 전용 worktree/branch에서만 작업하세요.
- 작업 시작 전에 git status와 현재 branch를 확인하세요.
- 다른 세션이 건드릴 수 있는 파일을 임의로 되돌리거나 정리하지 마세요.
- 소유 범위를 벗어나는 수정은 가능한 한 피하고, 꼭 필요하면 최소 범위로만 하세요.
- 관련 없는 포맷팅, 대규모 리네임, import 정렬-only 변경은 금지합니다.
- 병렬 세션 branch를 읽어 통합하는 동안에도 강제 reset이나 rebase로 타인 변경을 날리지 마세요.
- 마지막 보고 형식은 반드시 다음 순서를 지키세요:
  1. 변경 요약
  2. 테스트 결과
  3. 충돌 해결 포인트
  4. 남은 리스크
```

## Session 10

```text
Full access mode로 바로 작업하세요. Plan mode는 쓰지 말고, ERP 관련 화면의 문구와 상태 표현을 사용자가 헷갈리지 않게 다듬으세요.

작업 위치:
- client repo: c:\Users\정호수\Desktop\safty\worktrees\hanjongan-s10-microcopy

소유 범위:
- features/admin/**
- components/site/**
- app/sites/[siteKey]/**
- features/home/**
- 공통 토스트/에러/empty-state 유틸이 있으면 최소 범위로 포함 가능

목표:
- 로딩, 빈 상태, 권한 없음, 사전 선택 필요, 초안 없음, 원본 보고서 없음 같은 상태를 분명하게 표현
- 버튼 라벨과 설명을 현장 실무자 관점으로 단순하게 정리
- 관리자/작업자 각각에서 다음 행동이 보이게 개선

구체 작업:
- ambiguous한 문구, 버튼, 섹션 제목을 점검
- "현장을 먼저 선택하세요", "기준 보고서를 선택하세요", "이전 기술지도 보고서가 없습니다" 같은 핵심 안내를 UX 흐름에 맞게 배치
- destructive action이나 생성 액션에는 오해 여지 없는 라벨 사용
- 디자인 리뉴얼보다 사용성 개선에 집중

검증:
- npm run lint
- npm run build
- 화면 주요 진입 경로에서 문구가 흐름과 맞는지 확인

마무리:
- 커밋 메시지 예시: polish(erp): clarify action copy and state messaging
- origin/main 직접 push 금지
- 마지막에 어떤 혼동 포인트를 줄였는지 요약

공통 작업 규칙:
- 이 세션은 자신의 전용 worktree/branch에서만 작업하세요.
- 작업 시작 전에 git status와 현재 branch를 확인하세요.
- 다른 세션이 건드릴 수 있는 파일을 임의로 되돌리거나 정리하지 마세요.
- 소유 범위를 벗어나는 수정은 가능한 한 피하고, 꼭 필요하면 최소 범위로만 하세요.
- 관련 없는 포맷팅, 대규모 리네임, import 정렬-only 변경은 금지합니다.
- 병렬 세션은 origin/main에 직접 push하지 말고 세션 전용 branch까지만 올리거나 push 없이 종료하세요.
- 마지막 보고 형식은 반드시 다음 순서를 지키세요:
  1. 변경 요약
  2. 테스트 결과
  3. 충돌 가능 파일
  4. 다음 통합 세션이 볼 포인트
```

## Session 11

```text
Full access mode로 바로 작업하세요. Plan mode는 쓰지 말고, ERP 관련 관리자/작업자 화면의 실제 사용성을 점검하고 최소 수정으로 개선하세요.

작업 위치:
- client repo: c:\Users\정호수\Desktop\safty\worktrees\hanjongan-s11-ux-a11y

목표:
- 좁은 화면에서 표, 필터, 액션 버튼이 깨지지 않게 보완
- 키보드 이동, 포커스, 모달 접근성, aria 기본기를 점검
- 관리자 현황 표와 작업자 문서 진입 UI가 모바일에서도 최소 동작하도록 개선

구체 작업:
- 테이블 overflow, sticky header, action button 밀림, modal focus, form label 연결 상태를 점검
- 시각적 과장 없이 현재 톤을 유지
- 제품 구조를 바꾸지 말고 사용성 버그 위주로 수정

검증:
- npm run lint
- npm run build

마무리:
- 커밋 메시지 예시: fix(ux): improve erp accessibility and mobile resilience
- origin/main 직접 push 금지
- 마지막에 수정한 실제 UX 문제 목록 보고

공통 작업 규칙:
- 이 세션은 자신의 전용 worktree/branch에서만 작업하세요.
- 작업 시작 전에 git status와 현재 branch를 확인하세요.
- 다른 세션이 건드릴 수 있는 파일을 임의로 되돌리거나 정리하지 마세요.
- 소유 범위를 벗어나는 수정은 가능한 한 피하고, 꼭 필요하면 최소 범위로만 하세요.
- 관련 없는 포맷팅, 대규모 리네임, import 정렬-only 변경은 금지합니다.
- 병렬 세션은 origin/main에 직접 push하지 말고 세션 전용 branch까지만 올리거나 push 없이 종료하세요.
- 마지막 보고 형식은 반드시 다음 순서를 지키세요:
  1. 변경 요약
  2. 테스트 결과
  3. 충돌 가능 파일
  4. 다음 통합 세션이 볼 포인트
```

## Session 12

```text
Full access mode로 바로 작업하세요. Plan mode는 쓰지 말고, 현재 ERP 기능을 운영/시연/QA할 수 있는 문서를 정리하세요.

작업 위치:
- client repo: c:\Users\정호수\Desktop\safty\worktrees\hanjongan-s12-qa-docs

목표:
- 새 기능을 누가 어떻게 검증할지 바로 알 수 있는 문서 작성
- 관리자/작업자 대표 시나리오와 실패 케이스를 포함
- 제품 코드 수정은 최소화하고 docs 중심으로 정리

구체 작업:
- docs/erp-qa-checklist.md 생성
- docs/erp-operator-handoff.md 생성
- 반드시 포함:
  1. 관리자 핵심 시나리오
  2. 작업자 핵심 시나리오
  3. 보고서 작성/저장/재진입 확인 항목
  4. 로딩/빈 상태/권한 문제 확인 항목
  5. 배포 후 첫날 확인 포인트
- 실제 경로명/메뉴명 기준으로 적기

검증:
- 링크, 파일 경로, 화면 명칭 점검
- docs만 바뀌었는지 git diff 확인

마무리:
- 커밋 메시지 예시: docs(erp): add QA checklist and operator handoff
- origin/main 직접 push 금지
- 마지막에 QA에서 가장 위험한 포인트 5개 요약

공통 작업 규칙:
- 이 세션은 자신의 전용 worktree/branch에서만 작업하세요.
- 작업 시작 전에 git status와 현재 branch를 확인하세요.
- 다른 세션이 건드릴 수 있는 파일을 임의로 되돌리거나 정리하지 마세요.
- 소유 범위를 벗어나는 수정은 가능한 한 피하고, 꼭 필요하면 최소 범위로만 하세요.
- 관련 없는 포맷팅, 대규모 리네임, import 정렬-only 변경은 금지합니다.
- 병렬 세션은 origin/main에 직접 push하지 말고 세션 전용 branch까지만 올리거나 push 없이 종료하세요.
- 마지막 보고 형식은 반드시 다음 순서를 지키세요:
  1. 변경 요약
  2. 테스트 결과
  3. 충돌 가능 파일
  4. 다음 통합 세션이 볼 포인트
```

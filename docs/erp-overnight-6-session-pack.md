# ERP Overnight 6-Session Pack

## Purpose

- Collapse the larger ERP session plan into six practical full access sessions.
- Keep one final integration session instead of letting every branch push to `main`.
- Cover docs, worker flow, report authoring, admin visibility, stability, API support, and final smoke validation.

## Fast Start

1. Run `powershell -ExecutionPolicy Bypass -File .\scripts\setup-erp-worktrees.ps1 -Preset Overnight6`.
2. Start session A, B, C, D in parallel.
3. Start session E after the product flow shape is clear.
4. Start session F last, after A-E branches are ready.

## Session Map

| Session | Repo | Branch | Worktree |
| --- | --- | --- | --- |
| A | client | `erp/night-a-docs-suite` | `c:\Users\정호수\Desktop\safty\worktrees\hanjongan-night-a-docs` |
| B | client | `erp/night-b-worker-entry` | `c:\Users\정호수\Desktop\safty\worktrees\hanjongan-night-b-worker-entry` |
| C | client | `erp/night-c-report-authoring` | `c:\Users\정호수\Desktop\safty\worktrees\hanjongan-night-c-reports` |
| D | client | `erp/night-d-admin-overview` | `c:\Users\정호수\Desktop\safty\worktrees\hanjongan-night-d-admin` |
| E-client | client | `erp/night-e-stability-client` | `c:\Users\정호수\Desktop\safty\worktrees\hanjongan-night-e-client` |
| E-server | server | `erp/night-e-stability-api` | `c:\Users\정호수\Desktop\safty\worktrees\server-night-e-api` |
| F | client | `erp/night-f-merge-smoke` | `c:\Users\정호수\Desktop\safty\worktrees\hanjongan-night-f-merge` |

## Shared Rules

```text
공통 작업 규칙:
- 이 세션은 자신의 전용 worktree/branch에서만 작업하세요.
- 작업 시작 전에 git status와 현재 branch를 확인하세요.
- 관련 없는 포맷팅, 대규모 리네임, import 정렬-only 변경은 금지합니다.
- 다른 세션이 건드릴 수 있는 파일을 임의로 되돌리거나 정리하지 마세요.
- client/server를 둘 다 수정하는 세션은 커밋과 push를 리포지토리별로 분리하세요.
- 병렬 세션은 origin/main에 직접 push하지 말고 세션 전용 branch까지만 올리거나 push 없이 종료하세요.
- 마지막 보고 형식은 반드시 다음 순서를 지키세요:
  1. 변경 요약
  2. 테스트 결과
  3. 충돌 가능 파일
  4. 다음 통합 세션이 볼 포인트
```

## Session A

```text
Full access mode로 바로 작업하세요. Plan mode는 쓰지 말고, ERP 문서 패키지를 한 번에 정리하세요.

작업 위치:
- client repo: c:\Users\정호수\Desktop\safty\worktrees\hanjongan-night-a-docs

읽을 자료:
- c:\Users\정호수\Documents\카카오톡 받은 파일\통화 녹음 기빈이형_260330_223013_original.txt
- docs/erp-feature-spec.md
- docs/erp-transcript-gap-analysis.md

목표:
- 대화록 기준 gap analysis 문서를 최신화
- ERP 벤치마크 문서 작성
- QA 체크리스트와 운영자 인수인계 문서 작성
- 제품 코드는 수정하지 말고 docs만 정리

구체 작업:
- docs/erp-transcript-gap-analysis.md 점검 및 보강
- docs/erp-benchmark-2026-03.md 생성
- docs/erp-qa-checklist.md 생성
- docs/erp-operator-handoff.md 생성
- docs/erp-feature-spec.md에 명백한 누락만 최소 범위로 반영

검증:
- 링크, 파일 경로, 문서 간 참조 확인
- git diff로 docs 중심 변경인지 확인

마무리:
- 커밋 메시지 예시: docs(erp): add overnight planning, benchmark, and qa handoff
- origin/main 직접 push 금지
- 마지막에 남은 정책 결정 항목 요약

공통 작업 규칙:
- 이 세션은 자신의 전용 worktree/branch에서만 작업하세요.
- 작업 시작 전에 git status와 현재 branch를 확인하세요.
- 관련 없는 포맷팅, 대규모 리네임, import 정렬-only 변경은 금지합니다.
- 다른 세션이 건드릴 수 있는 파일을 임의로 되돌리거나 정리하지 마세요.
- 병렬 세션은 origin/main에 직접 push하지 말고 세션 전용 branch까지만 올리거나 push 없이 종료하세요.
- 마지막 보고 형식은 반드시 다음 순서를 지키세요:
  1. 변경 요약
  2. 테스트 결과
  3. 충돌 가능 파일
  4. 다음 통합 세션이 볼 포인트
```

## Session B

```text
Full access mode로 바로 작업하세요. Plan mode는 쓰지 말고, 작업자 현장 중심 ERP 진입 UX를 끝까지 정리하세요.

작업 위치:
- client repo: c:\Users\정호수\Desktop\safty\worktrees\hanjongan-night-b-worker-entry

소유 범위:
- components/worker/**
- features/home/**
- site 선택 진입용 새 UI/새 route가 필요하면 그 범위
- 작업자 진입 흐름과 직접 맞닿은 copy/empty state/a11y 보정은 허용
- components/site/OperationalReportsPanel.tsx
- app/sites/[siteKey]/quarterly/**
- app/sites/[siteKey]/bad-workplace/**
- admin overview 파일은 건드리지 말 것

목표:
- 작업자 UX를 현장 선택 -> 현장 허브/진입 -> 기술지도/분기/불량 흐름으로 정리
- 현장 컨텍스트가 없는 상태에서 분기/불량 기능으로 가려 하면 site picker를 먼저 보여주기
- 뒤로가기/제목/설명/empty state 문구를 단순하고 명확하게 정리
- 좁은 화면에서도 최소 동작하도록 진입 UI를 보완

검증:
- npm run lint
- npm run build
- 작업자 대표 라우트 수동 점검

마무리:
- 커밋 메시지 예시: feat(worker): add site-centric erp entry flow
- origin/main 직접 push 금지
- 마지막에 바뀐 진입 흐름과 남은 충돌 가능 파일 요약

공통 작업 규칙:
- 이 세션은 자신의 전용 worktree/branch에서만 작업하세요.
- 작업 시작 전에 git status와 현재 branch를 확인하세요.
- 관련 없는 포맷팅, 대규모 리네임, import 정렬-only 변경은 금지합니다.
- 다른 세션이 건드릴 수 있는 파일을 임의로 되돌리거나 정리하지 마세요.
- 병렬 세션은 origin/main에 직접 push하지 말고 세션 전용 branch까지만 올리거나 push 없이 종료하세요.
- 마지막 보고 형식은 반드시 다음 순서를 지키세요:
  1. 변경 요약
  2. 테스트 결과
  3. 충돌 가능 파일
  4. 다음 통합 세션이 볼 포인트
```

## Session C

```text
Full access mode로 바로 작업하세요. Plan mode는 쓰지 말고, 현장 컨텍스트 기반의 분기 종합보고서와 불량사업장 신고 흐름을 정교화하세요.

작업 위치:
- client repo: c:\Users\정호수\Desktop\safty\worktrees\hanjongan-night-c-reports

소유 범위:
- components/site/OperationalReportsPanel.tsx
- app/sites/[siteKey]/quarterly/**
- app/sites/[siteKey]/bad-workplace/**
- lib/erpReports/**
- hooks/useSiteOperationalReports.ts
- 필요 시 직접 연결된 타입/유틸
- worker menu/home/admin 파일은 건드리지 말 것

목표:
- 분기 종합보고서는 현장 진입 후 대상 분기 선택, 기준 보고서 선택 또는 자동 선택 정책을 명확히 UI로 제공
- 불량사업장 신고는 이전 기술지도 보고서 목록을 최신순으로 보여주고, 지적사항/원본 보고서 기반으로 초안을 만드는 흐름을 더 분명하게 제공
- 현장이 이미 선택된 상태에서는 현장 선택 단계 생략
- 관련 copy/empty state를 흐름 중심으로 함께 정리

검증:
- npm run lint
- npm run build
- quarterly/bad-workplace 기본 진입과 초안 생성 흐름 확인

마무리:
- 커밋 메시지 예시: feat(erp): refine quarterly and bad-workplace authoring flow
- origin/main 직접 push 금지
- 마지막에 분기/불량 각각 어떤 작성 흐름으로 정리했는지 요약

공통 작업 규칙:
- 이 세션은 자신의 전용 worktree/branch에서만 작업하세요.
- 작업 시작 전에 git status와 현재 branch를 확인하세요.
- 관련 없는 포맷팅, 대규모 리네임, import 정렬-only 변경은 금지합니다.
- 다른 세션이 건드릴 수 있는 파일을 임의로 되돌리거나 정리하지 마세요.
- 병렬 세션은 origin/main에 직접 push하지 말고 세션 전용 branch까지만 올리거나 push 없이 종료하세요.
- 마지막 보고 형식은 반드시 다음 순서를 지키세요:
  1. 변경 요약
  2. 테스트 결과
  3. 충돌 가능 파일
  4. 다음 통합 세션이 볼 포인트
```

## Session D

```text
Full access mode로 바로 작업하세요. Plan mode는 쓰지 말고, 관리자 ERP 운영 현황과 KPI 가시성을 실용적으로 보강하세요.

작업 위치:
- client repo: c:\Users\정호수\Desktop\safty\worktrees\hanjongan-night-d-admin

소유 범위:
- components/controller/**
- features/admin/sections/overview/**
- features/admin/lib/**
- 필요 시 admin overview 관련 타입/모델
- features/admin/sections/headquarters/**
- worker/site 문서 편집 페이지는 건드리지 말 것

목표:
- overview 또는 controller 영역에서 현장별 분기 대상/작성/미작성 현황, 요원별 월간 불량사업장 신고 실적, 빠른 이동 링크를 볼 수 있게 개선
- ERP 톤을 유지하면서 카드/표 중심으로 읽기 쉽게 정리
- 관리자 표/카드의 모바일 resilience와 기본 접근성을 함께 보강

검증:
- npm run lint
- npm run build

마무리:
- 커밋 메시지 예시: feat(admin): add erp operational status views
- origin/main 직접 push 금지
- 마지막에 관리자에서 새로 볼 수 있게 된 운영 정보와 충돌 가능 파일 요약

공통 작업 규칙:
- 이 세션은 자신의 전용 worktree/branch에서만 작업하세요.
- 작업 시작 전에 git status와 현재 branch를 확인하세요.
- 관련 없는 포맷팅, 대규모 리네임, import 정렬-only 변경은 금지합니다.
- 다른 세션이 건드릴 수 있는 파일을 임의로 되돌리거나 정리하지 마세요.
- 병렬 세션은 origin/main에 직접 push하지 말고 세션 전용 branch까지만 올리거나 push 없이 종료하세요.
- 마지막 보고 형식은 반드시 다음 순서를 지키세요:
  1. 변경 요약
  2. 테스트 결과
  3. 충돌 가능 파일
  4. 다음 통합 세션이 볼 포인트
```

## Session E

```text
Full access mode로 바로 작업하세요. Plan mode는 쓰지 말고, ERP 관리 흐름의 캐시/CRUD/로딩 안정성을 점검하고 꼭 필요한 최소 API 지원만 추가하세요.

작업 위치:
- client repo: c:\Users\정호수\Desktop\safty\worktrees\hanjongan-night-e-client
- server repo: c:\Users\정호수\Desktop\safty\worktrees\server-night-e-api

클라이언트 소유 범위:
- features/admin/hooks/**
- hooks/inspectionSessions/**
- features/site-reports/**
- lib/safetyApi/**
- 필요 시 관련 mapper/type

서버 소유 범위:
- server/app/**
- CLIENT_INTEGRATION_NOTES.md 또는 직접 연결된 서버 문서 최소 범위

목표:
- 사용자/사업장/현장 CRUD 후 UI가 새로고침 없이 일관되게 반영
- 보고서 목록 로딩 전 생성 버튼/빈 상태가 잘못 보이지 않게 정리
- 로그인 직후 불필요한 전체 fan-out이 없는지 감사
- 현장 선택, 기준 보고서 선택, 이전 보고서/지적사항 최신순 조회, 관리자 KPI를 지원하기에 API가 충분한지 점검
- 부족하면 최소 응답 필드 또는 최소 endpoint만 추가

검증:
- client: npm run lint
- client: npm run build
- server: 가능한 범위의 import/runtime 검증

마무리:
- 클라이언트와 서버는 리포지토리별로 커밋/푸시 분리
- 클라이언트 커밋 예시: fix(erp): harden cache refresh and loading guards
- 서버 커밋 예시: feat(api): support erp operational flows
- origin/main 직접 push 금지
- 마지막에 수정한 stale/로딩 문제와 API 변경 여부를 함께 요약

공통 작업 규칙:
- 이 세션은 자신의 전용 worktree/branch에서만 작업하세요.
- 작업 시작 전에 각 repo의 git status와 현재 branch를 확인하세요.
- 관련 없는 포맷팅, 대규모 리네임, import 정렬-only 변경은 금지합니다.
- 다른 세션이 건드릴 수 있는 파일을 임의로 되돌리거나 정리하지 마세요.
- client/server를 둘 다 수정하는 경우 커밋과 push는 리포지토리별로 분리하세요.
- 병렬 세션은 origin/main에 직접 push하지 말고 세션 전용 branch까지만 올리거나 push 없이 종료하세요.
- 마지막 보고 형식은 반드시 다음 순서를 지키세요:
  1. 변경 요약
  2. 테스트 결과
  3. 충돌 가능 파일
  4. 다음 통합 세션이 볼 포인트
```

## Session F

```text
Full access mode로 바로 작업하세요. Plan mode는 쓰지 말고, 병렬 세션 결과를 통합하고 ERP 핵심 흐름을 스모크 수준으로 검증하세요.

작업 위치:
- client repo: c:\Users\정호수\Desktop\safty\worktrees\hanjongan-night-f-merge

입력:
- 세션 B, C, D, E 결과 branch
- 필요 시 세션 A 문서 결과도 반영

목표:
- 병렬 결과를 충돌 없이 통합
- 관리자 사업장/현장/보고서 드릴다운, 작업자 현장 중심 진입, 분기/불량 작성 흐름, 로딩 중 생성 버튼 보호를 스모크 수준으로 검증
- scripts/smokeClient.ts를 보강하거나 정리해 최종 검증 포인트를 남김
- 최종적으로만 origin/main 반영

검증:
- npm run lint
- npm run build
- 가능한 범위에서 smoke 실행
- 핵심 라우트 수동 점검

마무리:
- 최종 통합 커밋
- 예시 메시지: chore(erp): integrate overnight session branches
- 이 세션만 origin/main에 push
- 마지막에 충돌 해결 포인트, 스모크 시나리오, 남은 리스크를 요약

공통 작업 규칙:
- 이 세션은 자신의 전용 worktree/branch에서만 작업하세요.
- 작업 시작 전에 git status와 현재 branch를 확인하세요.
- 관련 없는 포맷팅, 대규모 리네임, import 정렬-only 변경은 금지합니다.
- 다른 세션이 건드릴 수 있는 파일을 임의로 되돌리거나 정리하지 마세요.
- 병렬 세션 branch를 읽어 통합하는 동안에도 강제 reset이나 rebase로 타인 변경을 날리지 마세요.
- 마지막 보고 형식은 반드시 다음 순서를 지키세요:
  1. 변경 요약
  2. 테스트 결과
  3. 충돌 해결 포인트
  4. 남은 리스크
```

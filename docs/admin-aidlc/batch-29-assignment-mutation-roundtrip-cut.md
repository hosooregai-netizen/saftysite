# Batch 29: Assignment Mutation Roundtrip Cut

## Why
- 관제에서 지도요원 배정 저장 전 `loadAllSafetyAssignments()`가 전체 활성 배정 목록을 모두 다시 읽고 있어, 배정 수가 많을수록 저장 전에 이미 큰 지연이 생겼다.
- 서버가 조금만 느려져도 기본 12초 timeout에 걸려 `POST /assignments 요청이 12000ms 안에 완료되지 않았습니다` 오류가 보였다.

## What Changed
- admin assignment actions는 현재 dashboard state의 assignment 목록을 우선 사용하고, 충돌(`409`)이 났을 때만 전체 배정 목록을 다시 읽는다.
- 일반적인 배정/재배정 경로에서는 저장 전 전체 `/assignments` 페이지 순회를 제거했다.
- `/assignments` write 계열 요청은 GET 기본 timeout과 분리해 더 긴 write timeout을 사용한다.

## Proof
- `npx tsc --noEmit --pretty false`
- `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3211 npm run test:client:smoke -- admin-sites admin-control-center`

## Notes
- 이번 배치는 admin dashboard의 in-memory assignment state를 신뢰하는 방향으로 mutation 왕복을 줄인 것이다. 충돌 상황만 server truth를 다시 읽는다.

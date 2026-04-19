# Batch 31

## What changed
- 기본 `totalRounds`가 비어 있는 현장은 프론트 매퍼에서 `8회`로 보정한다.
- admin smoke에 사업장/현장 `생성 -> 수정 -> 삭제`와 현장 `배정 -> 해제` 흐름을 포함한다.
- worker smoke에 `/calendar` 방문 일정 선택과 저장 후 목록 반영 검증을 추가한다.
- mock admin directory list는 비활성 사업장/현장을 목록과 lookup에서 숨긴다.

## Why
- 운영 데이터에 총 계약회차가 비어 있는 현장이 많아서 지도요원과 관제 화면이 회차를 계산하지 못했다.
- 사업장/현장/배정 수정 API가 정상 동작하는지 smoke에서 빠져 있었고, 지도요원 일정 저장도 회귀 검증이 약했다.
- 삭제된 fixture가 목록에 남는 mock 응답은 실제 soft-delete hidden 계약과 맞지 않았다.

## Proof
- `npx tsc --noEmit --pretty false`
- `npm run test:client:smoke -- admin-headquarters admin-sites admin-schedules admin-control-center admin-reports admin-users worker-calendar`

# Batch 27: Analytics Legacy Backfill And Worker Round Selection

## Why
- legacy 기간에는 실제 기술지도 서비스 기록이 비어 있어 매출/실적 집계가 과도하게 낮게 보였다.
- 관제 일정 목록에서는 기존 일정을 눌러도 바로 수정 팝업으로 이어지지 않았다.
- 지도요원 일정 선택은 15일 슬롯 전제를 남겨 두고 있어 현장/회차를 직접 고르는 운영 흐름과 맞지 않았다.

## What Changed
- admin analytics 화면은 서버 `chart_year_slices`를 받아 연도별 직원/현장 집계와 추이 데이터를 그대로 사용한다.
- summary card delta는 더 이상 고정 `비교 없음`이 아니라 월/분기/연 단위 비교값으로 계산한다.
- `현장별 매출 상위 Top 10` 카드는 `상위 매출 사업장 Top 10`으로 바뀌고, 건설사명 기준 합산 매출을 보여준다.
- 직원별 상세표에서 `지연` 열을 제거했다.
- analytics 상세표는 직원별/현장별 모두 20건 페이지네이션을 적용했다.
- 관제 일정 목록 테이블과 미선택 큐 행을 누르면 바로 일정 수정/지정 팝업이 열린다.
- 지도요원 일정 선택 모달은 `배정된 현장 -> 회차 선택` 흐름으로 바뀌고, 날짜 기반 빈 회차 차단 문구를 제거했다.
- 지도요원 일정 선택 모달의 `배정된 현장` 목록은 월별 일정 rows가 아니라 실제 assigned site 목록을 기준으로 노출한다.
- 지도요원 회차 선택은 기술지도 보고서 기준 완료 회차를 제외하고, 남은 계약 회차만 고를 수 있게 정리했다. 완료된 현장은 모달에서 `총 계약회차 완료` 상태로 보인다.

## Proof
- `tests/client/admin/admin-control-center.spec.ts`
- `tests/client/admin/admin-schedules.spec.ts`
- `scripts/smoke-real-client/worker-flow.ts`
- `npx tsc --noEmit --pretty false`

## Notes
- synthetic 15일 cadence는 analytics 통계 보정용이며, 실제 일정 UX에서는 자유 날짜 선택 모델을 유지한다.
- worker 일정 저장은 기존 `/api/me/schedules/:id` PATCH 계약을 유지한다.

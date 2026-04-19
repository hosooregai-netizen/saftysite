# Batch 30: Analytics Basis Month Controls

## Why
- analytics의 `추이 및 기여도` 영역이 연도 slice 중심으로만 움직여 `2023년 기준`처럼 보였고, 사용자가 `2026-04` 같은 기준월을 직접 고를 수 없었다.
- 카드, 상세표, 차트가 같은 기간을 바라보지 않아 월 기준으로 해석하기 어려웠다.

## What Changed
- admin analytics에 `basisMonth` 상태와 `이전 달 / 이번 달 / 다음 달 / month picker` UI를 추가했다.
- `직원별 매출 기여도 Top 10`, `상위 매출 사업장 Top 10`, 직원별/현장별 상세표는 선택된 기준월의 `month slice`만 사용하도록 바꿨다.
- 월별 매출 추이 차트는 선택월이 속한 연도 전체를 유지하되, 선택월만 강조 표시한다.
- analytics API 프록시와 upstream mapper는 `basis_month`, `available_months`, `month_slices` 계약을 반영한다.

## Proof
- `npx tsc --noEmit --pretty false`
- `npm run test:client:smoke -- admin-control-center`

## Notes
- 상단 KPI 요약과 export는 기존 `period` 기준 집계를 유지하고, 기준월은 차트/기여도/상세표에만 적용한다.

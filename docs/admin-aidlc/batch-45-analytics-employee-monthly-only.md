# Batch 45. Analytics Employee Monthly Only

## Why
- 실적/매출 화면에서 요약 KPI 카드와 현장별 상세표가 더 이상 필요하지 않게 되었습니다.
- 운영 화면은 월별 추이와 직원별 월별 매출 표만 남기는 편이 더 단순하고 요구사항에 맞습니다.

## What changed
- `features/admin/sections/analytics/AnalyticsSection.tsx` no longer renders the analytics summary KPI section
- `features/admin/sections/analytics/AnalyticsDetailSection.tsx` now shows only the employee table and renames the section title to `직원별 월별 매출`
- `features/admin/sections/analytics/useAnalyticsSectionState.ts` removes the site-detail tab state and site pagination/sorting state
- `features/admin/sections/analytics/AnalyticsSectionHeader.tsx` now renders only the section title, removing search, filter, and export controls
- the monthly trend toolbar keeps only `이전 달 / 기준월 / 다음 달` controls and removes the month input and `이번 달` shortcut

## Proof
- `tests/client/admin/analytics-employee-monthly-only.md`

## Validation
- `npx tsc --noEmit --pretty false`

## Residual
- analytics summary/month-detail data still arrives from the server, but the admin UI now consumes only the month-based employee detail table

# Batch 38

## Summary
- `매출/실적` 화면에서 Top 10 카드를 제거하고, 기준월 차트 + 상세표 중심으로 단순화했다.
- analytics 상세표는 더 이상 `월별/누적` 토글 없이 선택한 `basis_month` 기준 detail API만 사용한다.
- 관제 방문 일정과 지도요원 방문 일정 모달에서 `변경 사유 기록` 체크 UI를 제거했다.
- 지도요원 캘린더 화면은 `월간 캘린더` 중심으로 정리하고 `미선택 회차`, `선택된 일정` 패널을 제거했다.
- 지도요원 일정 모달은 배정 현장별 완료 회차를 선택 시점에 lazy load 하도록 바꿔 초기 진입 비용을 줄였다.

## Files
- `features/admin/sections/analytics/AnalyticsSection.tsx`
- `features/admin/sections/analytics/AnalyticsCharts.tsx`
- `features/admin/sections/analytics/AnalyticsDetailSection.tsx`
- `features/admin/sections/analytics/useAnalyticsSectionState.ts`
- `features/admin/sections/schedules/SchedulesSection.tsx`
- `features/calendar/components/WorkerCalendarScreen.tsx`
- `tests/client/admin/admin-control-center.spec.ts`
- `tests/client/admin/admin-schedules.spec.ts`
- `tests/client/erp/worker-calendar.spec.ts`

## Verification
- `npx tsc --noEmit --pretty false`
- `npm run test:client:smoke -- admin-control-center admin-schedules worker-calendar`

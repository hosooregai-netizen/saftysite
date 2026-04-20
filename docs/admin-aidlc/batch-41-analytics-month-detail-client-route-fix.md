## Why
- 실적 상세표는 이미 월 기준 전용 API로 분리됐는데, 클라이언트가 여전히 legacy `/dashboard/analytics/detail` 경로를 호출하고 있었다.
- 이 때문에 기준월 상세표가 최신 month-detail 캐시/warmup 경로를 제대로 활용하지 못하고 응답 지연 체감이 남을 수 있었다.

## What
- `useAnalyticsSectionState`의 상세표 로더를 `fetchAdminAnalyticsDetail`에서 `fetchAdminAnalyticsMonthDetail`로 교체했다.
- 이제 상세표는 summary 이후 항상 `/dashboard/analytics/month-detail`만 호출한다.
- 월 기준 상세표 구조와 현재 UI 정책에 맞는 단일 경로로 정리했다.

## Proof
- `npx tsc --noEmit --pretty false`
- `npm run test:client:smoke -- admin-control-center` 는 로컬 3100 dev server 미기동으로 `ERR_CONNECTION_REFUSED` 확인

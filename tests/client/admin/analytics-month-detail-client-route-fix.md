## Verification
- `npx tsc --noEmit --pretty false`
- `useAnalyticsSectionState` 상세표 fetch 경로를 `/dashboard/analytics/detail`에서 `/dashboard/analytics/month-detail`로 교체
- 로컬 smoke는 3100 dev server가 떠 있지 않아 `ERR_CONNECTION_REFUSED`로 미실행 상태 확인

# Batch 34: Admin Analytics Summary/Detail Split

## Why
- `/admin?section=analytics`가 summary KPI, 추이 차트, 기준월 상세표를 한 번에 기다리면서 cold miss와 기준월 전환이 무거워졌다.
- 기준월 전환 시 KPI는 유지하고, 월별 Top 10/상세표만 다시 받아오도록 read path를 분리할 필요가 있었다.

## What Changed
- `/api/admin/dashboard/analytics`는 summary 전용 응답으로 매핑한다.
- `/api/admin/dashboard/analytics/month-detail` Next route를 추가해 기준월 상세 payload를 따로 읽는다.
- `useAnalyticsSectionState`를 summary/detail 2단계 로드로 재구성했다.
- 기준월 변경은 URL만 `history.replaceState`로 동기화하고, summary는 재요청하지 않고 month-detail만 다시 읽는다.
- admin smoke harness와 control-center smoke를 summary/detail split에 맞게 갱신했다.
- live API probe budget도 analytics summary / month-detail을 따로 측정하도록 나눴다.

## Proof
- `npx tsc --noEmit --pretty false`
- `npm run test:client:smoke -- admin-control-center`

# Batch 36

## Scope
- admin analytics 상세표를 chart/top10 기준월 로드와 분리해서 `월별 / 누적` 토글로 전환
- 보고서 PDF 생성 결과를 revision key 기준으로 캐시해서 다운로드와 메일 첨부에서 재사용

## Changes
- `/api/admin/dashboard/analytics/detail` 프록시와 상세표 전용 fetch 경로 추가
- `useAnalyticsSectionState`에서 summary, chart month detail, table detail 요청을 분리
- 상세표 헤더에 `월별 / 누적`, `직원별 / 현장별` 토글 추가
- bad workplace / quarterly / technical guidance PDF route에서 revision cache hit 시 변환 생략
- 메일 첨부 helper에서도 동일 보고서 PDF 요청을 메모리 캐시로 재사용

## Proof
- `npx tsc --noEmit --pretty false`
- `npm run test:client:smoke -- admin-control-center`
- `node --test --import tsx server/documents/shared/generatedReportPdfCache.test.ts`

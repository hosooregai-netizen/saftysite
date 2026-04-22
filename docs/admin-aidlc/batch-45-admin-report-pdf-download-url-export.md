# Batch 45

## Scope
- 관리자 전체 보고서의 기술지도 PDF export가 Vercel blob 응답 대신 서버 생성 다운로드 URL 경로를 우선 사용하도록 정리
- 서버 생성 PDF를 safety-api 공개 자산 경로로 업로드한 뒤 브라우저에는 다운로드 URL만 전달

## Changes
- `app/api/documents/inspection/pdf-download-url/route.ts` 추가
- 기술지도 PDF export에서 `pdf-download-url` 응답을 받아 바로 다운로드 링크를 여는 흐름으로 전환
- 생성한 PDF cache 메타에 업로드된 공개 자산 경로를 함께 보관
- safety-api upstream origin 기준으로 `/uploads/content-items/...` 공개 URL을 만들 수 있도록 admin server helper 보강
- 공개 자산이 아직 `inline` 으로 응답해도 브라우저가 PDF blob 을 직접 받아 파일 저장하도록 다운로드 helper 보강
- 공개 다운로드 URL 생성 시 내부 HTTP 업스트림 대신 자산 공개 HTTPS origin 을 우선 사용하도록 수정

## Proof
- `npx eslint app/api/documents/inspection/pdf-download-url/route.ts lib/api.ts features/inspection-session/hooks/useInspectionSessionScreen.ts features/admin/sections/reports/useReportDocumentActions.ts server/admin/safetyApiServer.ts server/documents/shared/generatedReportPdfCache.ts`
- `npx tsc --noEmit --pretty false`

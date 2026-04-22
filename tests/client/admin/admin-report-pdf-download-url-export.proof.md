## Admin Proof Note

- Scope: `features/admin/sections/reports/useReportDocumentActions.ts`, `app/api/documents/inspection/pdf-download-url/route.ts`
- Intent:
  - 기술지도 PDF export가 브라우저 HWPX -> Vercel PDF 변환 blob 경로보다 서버 생성 다운로드 URL 경로를 우선 사용한다.
  - 관리자 보고서 화면과 세션 화면이 같은 서버 생성 PDF 경로를 공유한다.
  - 생성한 PDF는 safety-api 공개 자산 URL로 내려주고 브라우저는 해당 URL만 연다.
  - 공개 자산 응답이 아직 `attachment` 로 배포되지 않아도 프론트가 blob 다운로드로 파일 저장을 시도한다.
  - 공개 다운로드 URL은 mixed-content 를 피하도록 공개 HTTPS 자산 origin 을 우선 사용한다.
- Checks:
  - `npx eslint app/api/documents/inspection/pdf-download-url/route.ts lib/api.ts features/inspection-session/hooks/useInspectionSessionScreen.ts features/admin/sections/reports/useReportDocumentActions.ts server/admin/safetyApiServer.ts server/documents/shared/generatedReportPdfCache.ts`
  - `npx tsc --noEmit --pretty false`

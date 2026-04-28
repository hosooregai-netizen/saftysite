## Admin Proof Note

- Scope: `features/admin/sections/reports/useReportDocumentActions.ts`, `lib/admin/adminShared.ts`
- Intent:
  - 작업자도 기술지도 PDF 공개 자산 업로드 경로를 사용할 수 있어 관리자와 같은 다운로드 URL 흐름을 쓴다.
  - 관리자 보고서 목록은 다운로드 URL 생성이 실패해도 직접 PDF export를 다시 시도한 뒤 마지막에만 HWPX로 폴백한다.
- Checks:
  - `npx eslint features/admin/sections/reports/useReportDocumentActions.ts features/inspection-session/hooks/useInspectionSessionScreen.ts lib/admin/adminShared.ts`
  - `npx tsc --noEmit --pretty false`

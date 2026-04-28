## Scope

- 작업자 세션 화면에서 기술지도 PDF 다운로드가 업로드 권한 상태에 따라 서버 URL 또는 직접 PDF export 경로를 고른다.
- 다운로드 URL 생성이 실패해도 PDF 직접 export를 먼저 시도하고, 실제 PDF 생성까지 실패할 때만 HWPX로 폴백한다.

## Proof

- `npx eslint features/inspection-session/hooks/useInspectionSessionScreen.ts lib/admin/adminShared.ts`
- `npx tsc --noEmit --pretty false`

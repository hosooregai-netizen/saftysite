# Batch 76

## Scope
- 작업자도 기술지도 PDF 공개 자산 업로드 경로를 사용할 수 있도록 권한 판단을 관리자 화면과 세션 화면에 맞춤
- 관리자 보고서 PDF 다운로드 URL 생성이 실패해도 즉시 HWPX로 떨어지지 않고 직접 PDF export를 재시도

## Changes
- `lib/admin/adminShared.ts`에서 `field_agent`도 콘텐츠 자산 업로드 가능 역할로 포함
- `features/admin/sections/reports/useReportDocumentActions.ts`에서 `pdf-download-url` 실패 시 직접 PDF export를 다시 시도하고 마지막에만 HWPX로 폴백
- 작업자 권한이 URL 업로드 경로를 사용할 수 없는 배포 상태에서도 관리자 화면이 PDF 다운로드를 계속 시도하도록 정리

## Proof
- `npx eslint features/admin/sections/reports/useReportDocumentActions.ts features/inspection-session/hooks/useInspectionSessionScreen.ts lib/admin/adminShared.ts`
- `npx tsc --noEmit --pretty false`

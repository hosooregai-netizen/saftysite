# Batch 68: Admin Original PDF Download Actions

## Intent

- Add an explicit PDF download action anywhere admins open a legacy original PDF.
- Keep the in-app original-PDF viewer while also letting admins save the exact file without using browser-native PDF controls.
- Preserve the actual filename returned by the original-PDF route so downloads match the source document.

## Admin Contract Impact

- `features/admin/sections/reports/ReportsOriginalPdfDialog.tsx` now exposes a `PDF 다운로드` action when a legacy original PDF is loaded in the modal viewer.
- `features/admin/sections/reports/useReportsSectionState.ts` now loads both the original-PDF blob and filename for the admin reports modal.
- `app/admin/report-open/page.tsx` now exposes direct download actions on the standalone legacy original-PDF page as well.

## Deployment Notes

- No environment-variable changes are required.
- This is a UI/UX improvement on top of the existing original-PDF delivery path.

## Verification

- `pnpm exec tsx --test server/mail/reportAttachment.test.ts app/api/mail/send-report/route.test.ts`
- `pnpm exec eslint features/admin/sections/reports/ReportsOriginalPdfDialog.tsx features/admin/sections/reports/useReportsSectionState.ts app/admin/report-open/page.tsx server/mail/reportAttachment.ts server/mail/reportAttachment.test.ts app/api/mail/send-report/route.ts app/api/mail/send-report/routeHelpers.ts app/api/mail/send-report/route.test.ts`
- `pnpm exec tsc --noEmit --pretty false`
- `npm run build`

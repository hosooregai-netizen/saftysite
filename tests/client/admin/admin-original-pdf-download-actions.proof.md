# Admin Original PDF Download Actions Proof

## Scope

- the admin reports original-PDF modal should expose an explicit download action once the PDF is loaded
- the standalone admin original-PDF page should expose an explicit download action with the resolved filename
- legacy oversized mail attachments should still resolve to original-PDF download URLs during server-side preparation

## Validation

- `pnpm exec tsx --test server/mail/reportAttachment.test.ts app/api/mail/send-report/route.test.ts`
- `pnpm exec eslint features/admin/sections/reports/ReportsOriginalPdfDialog.tsx features/admin/sections/reports/useReportsSectionState.ts app/admin/report-open/page.tsx server/mail/reportAttachment.ts server/mail/reportAttachment.test.ts app/api/mail/send-report/route.ts app/api/mail/send-report/routeHelpers.ts app/api/mail/send-report/route.test.ts`
- `pnpm exec tsc --noEmit --pretty false`
- `npm run build`

## Notes

- Local runtime reproduction confirmed `legacy:technical_guidance:427520` resolves to an attachment payload with `download_url=/api/admin/reports/.../original-pdf` and `size_bytes=71241257`.

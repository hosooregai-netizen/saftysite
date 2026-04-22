## Scope

- restore the inspection session PDF button to prefer the report-key server export path again
- avoid sending browser-generated HWPX blobs back through the Vercel PDF route before trying the server path

## Proof

- `npx eslint features/inspection-session/hooks/useInspectionSessionScreen.ts`
- session screen PDF export now calls `fetchInspectionPdfDocumentByReportKeyWithFallback(...)` before any local HWPX fallback

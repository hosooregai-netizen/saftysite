# ERP Proof Companion: Quarterly Export OPS Image And Risk Reflow

## Covered Source Areas

- `features/site-reports/quarterly-report/useQuarterlyDocumentActions.ts`
- `features/site-reports/quarterly-report/useQuarterlyReportEditor.ts`
- `lib/api.ts`
- `server/documents/quarterly/hwpx.ts`
- `server/documents/quarterly/hwpx.test.ts`

## Proof Notes

- site quarterly export now posts the current in-memory draft and site payload directly so the
  downloaded HWPX/PDF uses the same OPS asset metadata shown in the editor
- quarterly HWPX image resolution now accepts opaque download responses and normalizes unsupported
  image formats before embedding them into the package
- future-plan hazard and countermeasure cells rebuild paragraph runs and line-segment positions so
  multiline text does not overlap inside the exported table

## Existing Coverage

- `server/documents/quarterly/hwpx.test.ts`
- `tests/client/erp/quarterly-report.spec.ts`
- `tests/client/erp/mobile-quarterly-report.spec.ts`

# Batch 64: Admin Reports Updated-At Column Removal

## Intent

- Remove the `수정일` column from the admin reports list because it is not needed in the main grid.
- Keep the visible default sort aligned with the remaining columns by using `기준일` as the default sort key.

## Admin Contract Impact

- `features/admin/sections/reports/ReportsTable.tsx` no longer renders the `수정일` header cell or row value cell.
- `features/admin/sections/reports/useReportsSectionState.ts` now defaults the reports list sort to `visitDate desc` instead of the hidden `updatedAt` column.
- `features/admin/sections/reports/useReportDocumentActions.ts` removes `수정일` from the fallback workbook export so the exported columns match the table.

## Deployment Notes

- No API, schema, or environment changes are required.
- Client deployment only.

## Verification

- `npx eslint features/admin/sections/reports/ReportsTable.tsx features/admin/sections/reports/useReportsSectionState.ts features/admin/sections/reports/useReportDocumentActions.ts`


# Admin Reports Updated-At Column Removal Proof

## Scope

- the admin reports list should no longer show a `수정일` column
- the default list sort should remain visible and understandable after the column removal
- fallback workbook export should match the visible report table columns

## Validation

- `npx eslint features/admin/sections/reports/ReportsTable.tsx features/admin/sections/reports/useReportsSectionState.ts features/admin/sections/reports/useReportDocumentActions.ts`

## Notes

- This change only removes a redundant presentation column and updates the default sort to the still-visible `기준일`.
- No API contract or row-shape changes were required.


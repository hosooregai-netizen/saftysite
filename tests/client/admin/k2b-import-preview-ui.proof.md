# K2B Import Preview UI Proof

## Scope

- K2B Excel import hides the long K2B guidance copy in the modal and preview header.
- K2B preview hides the file, scope, and single-sheet chips while keeping a sheet select for multi-sheet files.
- K2B included rows render only company name, site name, project amount, contract period, contract signed date, and total guidance rounds.
- Values are read through `selectedSheet.suggestedMapping`; project amount falls back to `total_contract_amount`.
- Generic Excel import keeps the existing all-header table and mapping UI.

## Validation

- `npx eslint features/admin/sections/excelImport/ExcelImportSection.tsx features/admin/sections/excelImport/ExcelImportModal.tsx`
- `npm run build`

## Residual Risk

- Browser upload verification with `k2b_sample_format_final_test.xlsx` was not run in this session.

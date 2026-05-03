# Batch 98: K2B Excel Import Entrypoint

## Scope

- `features/admin/sections/headquarters/HeadquartersTable.tsx`
- `features/admin/sections/headquarters/HeadquartersSection.tsx`
- `features/admin/sections/excelImport/ExcelImportModal.tsx`
- `features/admin/sections/excelImport/ExcelImportSection.tsx`
- `lib/excelImport/apiClient.ts`
- `server/admin/upstreamMappers.ts`

## Change

- Added `엑셀로 추가` next to `건설사 추가` in the headquarters list.
- The modal sends K2B import mode through parse/apply requests so included rows can register contractors, sites, schedules, and guidance reports.
- Extended import result summaries with schedule/report creation and reuse counts.

## Validation

- `npx tsc --noEmit`
- `.venv\Scripts\python.exe -m pytest tests/test_excel_import.py -q`

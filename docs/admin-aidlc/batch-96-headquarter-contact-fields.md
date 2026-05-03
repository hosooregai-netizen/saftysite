# Batch 96: Headquarter Contact Fields

## Scope

- `features/admin/sections/headquarters/HeadquarterEditorModal.tsx`
- `features/admin/sections/headquarters/HeadquartersSection.tsx`
- `features/admin/sections/headquarters/HeadquartersTable.tsx`
- `features/admin/sections/headquarters/HeadquarterSummaryPanel.tsx`
- `features/admin/sections/headquarters/useHeadquartersSectionState.ts`
- `features/admin/sections/sites/SiteEditorModal.tsx`
- `features/admin/sections/excelImport/ExcelImportSection.tsx`
- `server/admin/adminDirectoryLists.ts`
- `types/controller.ts`
- `types/backend.ts`
- `tests/client/admin/admin-headquarters.spec.ts`
- `tests/client/fixtures/erpSmokeHarness.ts`

## Change

- Headquarter create/edit surfaces contractor contact fields as 담당자명, 담당자 연락처, 담당자 이메일, and 본사 주소.
- The construction license input is hidden from headquarter and inline site headquarter creation modals while preserving the existing stored value internally.
- Headquarter list, summary, export, Excel import labels, search, and missing-field checks now account for contractor contact email.
- Admin smoke fixtures and headquarter flow assertions use the new contact labels.

## Validation

- `npx eslint features/admin/sections/headquarters/HeadquarterEditorModal.tsx features/admin/sections/headquarters/useHeadquartersSectionState.ts features/admin/sections/headquarters/HeadquartersSection.tsx features/admin/sections/headquarters/HeadquartersTable.tsx features/admin/sections/headquarters/HeadquarterSummaryPanel.tsx features/admin/sections/sites/SiteEditorModal.tsx features/admin/sections/excelImport/ExcelImportSection.tsx server/admin/adminDirectoryLists.ts tests/client/fixtures/erpSmokeHarness.ts tests/client/admin/admin-headquarters.spec.ts types/controller.ts types/backend.ts`
- `npx tsc --noEmit`

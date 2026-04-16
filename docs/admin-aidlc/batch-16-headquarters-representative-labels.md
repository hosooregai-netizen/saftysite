# Admin AIDLC Batch 16: Headquarters Representative Labels

## Scope

- align 사업장(본사) UI copy with **대표자** terminology instead of **담당자** for the `contact_name` field
- keep data model keys unchanged (`contact_name`); only visible labels, placeholders, validation messages, and export column titles

## Repo Changes

### Frontend

- `HeadquartersTable`: list column header, search placeholder, summary card meta, missing-field label for contact name
- `HeadquarterEditorModal`: field label `본사 대표자명`
- `HeadquartersSection`: max-length validation label, Excel export column label
- `HeadquarterSummaryPanel`: missing-field and context labels
- `ExcelImportSection`: `contact_name` display label for import preview

### Proof

- `tests/client/admin/admin-headquarters.spec.ts`: create dialog label assertion
- `scripts/smoke-real-client/admin-sections/sites.ts`: headquarter search placeholder
- `tooling/internal/smokeClient_impl.ts`: headquarter create/edit dialog label for contact field

## Verification

- `npx tsc --noEmit`
- `npm run aidlc:audit:admin`

# Admin AIDLC Batch 25: Headquarters List Order and Count

## Scope

- `features/admin/components/AdminDashboardSectionContent.tsx`
- `features/admin/sections/headquarters/**`
- `features/admin/sections/AdminSectionShared.module.css`
- `server/admin/adminDirectoryLists.ts`

## Intent

- show `현장 수` in the headquarters list without adding a new persisted column
- show a `순번` column based on the current list order
- make the default headquarters list order `created_at desc` so the newest headquarters appears first

## Validation

- `npm run build`

## Notes

- `현장 수` is derived from the already loaded site list by `headquarter_id`
- `순번` is a UI index, not a stored database field
- `created_at` already exists on headquarters rows, so no DB schema change was required for the default sort

# Admin AIDLC Batch 48: Site List Project Kind Column Removal

## Scope

- `features/admin/sections/sites/SitesTable.tsx`
- `tests/client/admin/admin-site-list-project-kind-column-removal.md`

## Intent

- remove the `공사 종류` column from the admin site list table inside the 사업장/현장 목록 flow
- keep the remaining table columns aligned so the row action menu and progress/status cells still render in the expected positions
- leave list search/filter behavior unchanged because this batch only trims the visible table column set

## Validation

- `npx tsc --noEmit --pretty false`
- `npm run aidlc:audit:admin`

## Notes

- the table still receives `project_kind` data from the server, but the list no longer renders or sorts by that field
- this batch is presentation-only and does not change site edit, assignment, export, or drilldown behavior

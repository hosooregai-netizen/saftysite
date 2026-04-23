# Admin Reports Review Column Removal Proof

## Scenario

- The admin reports table showed a `검토체크` column even though review actions are already available from the row menu and bulk action bar.
- The list should stay focused on report identity, site, assignee, dates, and actions without repeating review state in a dedicated column.

## Expected Result

- The reports table no longer renders a `검토체크` header.
- Report rows no longer render a per-row review status cell.
- Review actions remain available from the row action menu and the bulk action bar.
- The remaining table columns still align correctly and open the same row actions as before.

## Commands Run

- `npx eslint features/admin/sections/reports/ReportsTable.tsx`
- `npx tsc --noEmit --pretty false`


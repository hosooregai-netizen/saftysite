# Batch 61: Admin Reports Review Column Removal

## Intent

- Remove the redundant `검토체크` column from the admin reports table.
- Keep report review available from existing row actions and bulk actions without repeating the status in the main grid.

## Admin Contract Impact

- `features/admin/sections/reports/ReportsTable.tsx` no longer renders the review-status header cell.
- Report rows no longer render a dedicated review-status value cell.
- Row menu actions such as `검토 체크` and bulk review actions remain unchanged.
- Report list navigation, sorting, and row-open behavior are unchanged.

## Deployment Notes

- No API, schema, or environment changes are required.
- Client deployment only.

## Verification

- `npx eslint features/admin/sections/reports/ReportsTable.tsx`
- `npx tsc --noEmit --pretty false`


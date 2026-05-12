# Batch 97: Headquarter Summary Simplification

## Scope

- `features/admin/sections/headquarters/HeadquarterSummaryPanel.tsx`
- `features/admin/sections/AdminSectionShared.module.css`

## Change

- Removed the headquarter completion badge and the data-completion and registration-status cards from the headquarter information summary.
- Kept registration-number fields as plain registration values without surfacing missing-field or required-state text in the summary panel.
- Added a clearer `담당자 연락 정보` card and let the headquarters address card span the aside grid.

## Validation

- `npx eslint features/admin/sections/headquarters/HeadquarterSummaryPanel.tsx`
- `npx tsc --noEmit`

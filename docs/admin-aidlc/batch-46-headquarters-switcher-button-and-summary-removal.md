# Admin AIDLC Batch 46: Headquarters Switcher Button and Summary Removal

## Scope

- `features/admin/sections/headquarters/HeadquartersTable.tsx`
- `features/admin/sections/AdminSectionShared.module.css`
- `scripts/smoke-real-client/admin-sections/sites.ts`

## Intent

- make the `사업장 목록 / 현장 목록 보기` and `현장 목록 / 사업장 목록 보기` header actions read as explicit navigation buttons instead of low-contrast inline pills
- remove the headquarters list summary cards so the screen focuses on the table and navigation only
- keep the same drilldown structure between the headquarter list and the site list while making the shared switcher affordance easier to notice

## Validation

- `npx tsc --noEmit --pretty false`

## Notes

- the switcher styling is implemented in the shared admin section stylesheet so both the headquarters list and the site list inherit the same stronger button treatment
- the headquarters summary cards are removed from the list view only; detailed headquarter/site context panels remain unchanged in deeper drilldown screens

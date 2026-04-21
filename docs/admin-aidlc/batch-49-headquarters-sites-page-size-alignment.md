# Admin AIDLC Batch 49: Headquarters And Sites Page Size Alignment

## Scope

- `features/admin/sections/headquarters/HeadquartersSection.tsx`
- `features/admin/sections/sites/useSitesSectionState.ts`
- `tests/client/admin/admin-headquarters.spec.ts`
- `tests/client/admin/admin-headquarters-sites-pagination-state-hold.md`

## Intent

- align the admin 사업장 목록 and 현장 목록 pagination to 10 rows per page
- keep the existing cached-page loading behavior so the previous rows stay visible while the next page request resolves
- preserve the existing drilldown and selection restore flow without requiring backend pagination changes

## Validation

- `npx tsc --noEmit --pretty false`

## Notes

- the client continues to pass explicit `limit` and `offset` values to the existing admin list APIs, so this batch remains frontend-only
- headquarters pagination now uses a shared page-size constant instead of repeated inline `30` values
- site list session-cache keys move to a new `v2` prefix so browsers do not keep rendering stale 50-row cached payloads after the page-size change

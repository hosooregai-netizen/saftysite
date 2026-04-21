# Admin AIDLC Batch 47: Headquarters And Sites Pagination State Hold

## Scope

- `features/admin/hooks/useAdminDashboardRouting.ts`
- `features/admin/sections/headquarters/HeadquartersSection.tsx`
- `features/admin/sections/headquarters/HeadquartersTable.tsx`
- `features/admin/sections/headquarters/useHeadquartersSectionState.ts`
- `features/admin/sections/sites/useSitesSectionState.ts`
- `features/admin/sections/users/useUsersSectionState.ts`

## Intent

- keep the current headquarters/site/user list rows visible while the next uncached page request is loading
- avoid the first `1 -> 2` pagination jump briefly falling back to the empty-state skeleton when page 1 was restored from cache only
- let the headquarters section own headquarter/site context restoration without the shell eagerly clearing the URL before the section list APIs resolve

## Validation

- `npx tsc --noEmit --pretty false`
- `npm run aidlc:audit:admin`

## Notes

- the pagination change stores the currently rendered response as a temporary stable fallback only when the user explicitly changes pages
- search, sort, and filter submission flows keep their existing behavior; this batch only targets page-to-page transitions
- the users section follows the same pagination stabilization pattern so the shared list behavior does not drift across admin screens

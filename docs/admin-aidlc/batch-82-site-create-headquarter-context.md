# Admin AIDLC Batch 82: Site Create Headquarter Context

## Goal

Make construction company registration the first step before creating a site from admin directory views.

## Scope

- `features/admin/sections/headquarters/HeadquartersSection.tsx`
- `features/admin/sections/sites/SitesSection.tsx`
- `features/admin/sections/sites/siteSectionHelpers.ts`
- `tests/client/admin/admin-headquarters.spec.ts`

## Implementation Record

- `SitesSection` now accepts `allowCreate` so site creation can be disabled per route context.
- The standalone all-sites view opened from `현장 목록 보기` hides `현장 추가`.
- The standalone all-sites view no longer passes inline headquarter creation into the site editor, so `새 건설사` is not available there.
- Headquarter drilldown site lists keep the existing `현장 추가` and inline headquarter context behavior.

## Validation

- `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3100 npm run test:client:smoke -- admin-headquarters`
- `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3100 npm run test:client:smoke -- admin-sites`

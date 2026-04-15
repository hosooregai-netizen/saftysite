# Admin AIDLC Batch 11: Headquarters and Sites Header Navigation

## Scope

- add a lightweight text-only link from the headquarter list header to the site list view
- add the reverse text-only link from the site list header back to the headquarter list view
- keep the existing `headquarters` section route model instead of introducing a new top-level tab

## Repo Changes

### Frontend

- `HeadquartersTable` now renders `현장 목록 보기` beside `사업장 목록`
- `SitesSection` now supports an optional title action link rendered in the same text-only style
- `HeadquartersSection` passes `사업장 목록 보기` only for the standalone site-list state driven by `siteStatus`
- shared admin section styles now include the inline title-row and text-link treatment
- standalone site list header no longer shows the count meta beside the title
- standalone site list header no longer shows the create-site action in the toolbar
- the `지도요원` site-list column now prefers `inspector_name` and falls back to `guidance_officer_name`
- site-list date displays now shorten the year prefix so period and last-visit cells avoid awkward wraps

## Navigation Contract

- headquarter list to site list uses `/admin?section=headquarters&siteStatus=all`
- standalone site list to headquarter list uses `/admin?section=headquarters`
- headquarter drilldown states remain unchanged

## Proof Companion

- `tests/client/admin/admin-headquarters-site-header-navigation.md`
  - records the intended bidirectional header navigation behavior

## Verification

- `npx tsc --noEmit`
- `npm run aidlc:audit:admin`

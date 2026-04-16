# Admin AIDLC Batch 17: Headquarters Site Drilldown — Site Main Only

## Scope

- when a specific site is selected in the `headquarters` section (`siteId` query present), render only the site main panel
- avoid stacking `HeadquarterSummaryPanel`, `SiteManagementMainPanel`, and `SitesSection` on the same screen
- keep the `headquarter selected but no site` state as summary + site list unchanged

## Repo Changes

### Frontend

- `HeadquartersSection`: `selectedSite` branch now renders `SiteManagementMainPanel` only (no headquarter summary card and no site list table below)

## Navigation Contract

- `clearSiteSelection` still clears `siteId` and returns to the site list for the current headquarter
- report and quarterly links on the site main panel continue to navigate to worker routes (`buildSiteReportsHref`, `buildSiteQuarterlyListHref`)

## Proof Companion

- `tests/client/admin/admin-headquarters-site-drilldown-main-only.md`

## Verification

- `npx tsc --noEmit`
- `npm run aidlc:audit:admin`

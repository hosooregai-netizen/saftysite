# Admin Proof: Headquarters Site Drilldown — Site Main Only

## Expected Behavior

- with `section=headquarters`, `headquarterId` set, and `siteId` set (a site row was opened), the page shows only the site main card grid and action links (`기술지도 보고서 목록`, `분기 보고서 목록`, etc.)
- the same view does not show the headquarter summary panel above the site main
- the same view does not show the full site list table below the site main
- with `headquarterId` set and no `siteId`, the headquarter summary and site list table still appear as before

## Manual Check

- open admin `사업장 / 현장`, pick a headquarter, then pick a site
- confirm only the site main panel is visible (no duplicate site list under it)
- use the shell back control labeled `현장 목록` to return to the site list state

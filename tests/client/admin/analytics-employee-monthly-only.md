# Admin Analytics Employee Monthly Only

## Scope

- the analytics page no longer renders KPI summary cards
- the detail section title is `직원별 월별 매출`
- the site-detail tab is removed and only the employee monthly table remains

## Verification

- `npx tsc --noEmit --pretty false`

## Manual Check

- open `/admin?section=analytics`
- confirm the page shows the analytics header and monthly trend section without KPI cards
- confirm the lower section title is `직원별 월별 매출`
- confirm there is no `현장별` tab and only the employee table with pagination remains

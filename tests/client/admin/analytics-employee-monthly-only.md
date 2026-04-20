# Admin Analytics Employee Monthly Only

## Scope

- the analytics page hides the requested KPI cards and support-strip metrics while keeping the remaining summary cards
- the detail section title is `직원별 월별 매출`
- the site-detail tab is removed and only the employee monthly table remains
- the analytics header no longer shows search, filter, or export controls
- the month toolbar no longer shows the month input or `이번 달` button

## Verification

- `npx tsc --noEmit --pretty false`

## Manual Check

- open `/admin?section=analytics`
- confirm the page keeps the remaining summary cards but does not show the removed KPI/support items
- confirm the lower section title is `직원별 월별 매출`
- confirm there is no `현장별` tab and only the employee table with pagination remains
- confirm there is no search box, filter menu, or `엑셀 내보내기` button in the analytics header
- confirm the month toolbar shows only `이전 달`, the current badge, and `다음 달`

# Admin Proof: Headquarters and Sites Header Navigation

## Expected Behavior

- the `사업장 목록` header shows a lightly outlined `현장 목록 보기` action beside the title
- the `현장 목록` header shows a lightly outlined `사업장 목록 보기` action beside the title
- both actions should read as secondary navigation buttons without competing with the main toolbar buttons
- the reverse link is only shown for the standalone site-list state, not inside headquarter drilldown detail layouts
- the standalone site-list header does not show a total-count caption beside the title
- the standalone site-list toolbar does not show a create-site button
- the `지도요원` column displays `inspector_name` first and only falls back to `guidance_officer_name`
- the period and last-visit date cells use shortened year text such as `26-03` and `26.05.06`

## Route Expectations

- clicking `현장 목록 보기` navigates to `/admin?section=headquarters&siteStatus=all`
- clicking `사업장 목록 보기` navigates to `/admin?section=headquarters`

## Manual Check

- open the admin `사업장 / 현장` section at the headquarter list state
- confirm the title-side text action moves to the standalone site list
- confirm the standalone site list shows the reverse text action and returns to the headquarter list

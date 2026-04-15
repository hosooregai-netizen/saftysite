# Admin Proof: Headquarters and Sites Header Navigation

## Expected Behavior

- the `사업장 목록` header shows a text-only `현장 목록 보기` action on the right side of the title
- the `현장 목록` header shows a text-only `사업장 목록 보기` action on the right side of the title
- neither action uses button chrome such as filled background, border, or icon
- the reverse link is only shown for the standalone site-list state, not inside headquarter drilldown detail layouts

## Route Expectations

- clicking `현장 목록 보기` navigates to `/admin?section=headquarters&siteStatus=all`
- clicking `사업장 목록 보기` navigates to `/admin?section=headquarters`

## Manual Check

- open the admin `사업장 / 현장` section at the headquarter list state
- confirm the title-side text action moves to the standalone site list
- confirm the standalone site list shows the reverse text action and returns to the headquarter list

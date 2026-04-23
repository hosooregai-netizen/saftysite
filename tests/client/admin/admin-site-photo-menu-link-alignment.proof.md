# Admin Site Photo Menu Link Alignment Proof

## Scenario

- In the admin site context, the site main screen `사진첩` button opened the site-scoped photo album.
- The side-menu `현장 사진첩` entry opened a different admin-wide photo route.
- Both entry points should open the same site photo album flow.

## Expected Result

- The side-menu `현장 사진첩` link opens `/sites/[siteId]/photos`.
- The admin site main `사진첩` action and the side-menu `현장 사진첩` action land on the same screen.
- Admin site context remains preserved through the shared site photo album shell.

## Commands Run

- `npx eslint components/admin/AdminMenu.tsx`
- `npx tsc --noEmit --pretty false`


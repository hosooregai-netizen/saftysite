# Batch 93 - Content Sort Numbering

## Scope

- `features/admin/sections/content/ContentItemsSection.tsx`

## Change

- Changed the content CRUD default list sort from title to `sort_order` ascending.
- Added a visible `번호` column that numbers rows according to the current filtered/sorted result, with the underlying `정렬 {sort_order}` value shown as secondary text.
- Added the same numbered order to the content export workbook so exported rows match the screen order.

## Verification

- `npx eslint features/admin/sections/content/ContentItemsSection.tsx`
- `npx tsc --noEmit`

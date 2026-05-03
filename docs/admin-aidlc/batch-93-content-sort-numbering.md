# Batch 93 - Content Sort Numbering Rollback

## Scope

- `features/admin/sections/content/ContentItemsSection.tsx`

## Change

- Reverted the content CRUD list numbering change.
- Restored the content CRUD default sort to title-based sorting.
- Kept `sort_order` visible only through the existing editor/export data path, without adding extra row numbering to the CRUD table.

## Verification

- `npx eslint features/admin/sections/content/ContentItemsSection.tsx`
- `npx tsc --noEmit`

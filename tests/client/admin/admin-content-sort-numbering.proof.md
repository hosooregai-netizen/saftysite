# Admin Content Sort Numbering Proof

- Static proof: `npx eslint features/admin/sections/content/ContentItemsSection.tsx`
- Type proof: `npx tsc --noEmit`

The content CRUD table now defaults to `sort_order` ascending, shows a visible `번호` column based on the current filtered and sorted row order, and includes that numbering in export rows.

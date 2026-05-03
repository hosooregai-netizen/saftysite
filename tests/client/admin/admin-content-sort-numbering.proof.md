# Admin Content Sort Numbering Rollback Proof

- Static proof: `npx eslint features/admin/sections/content/ContentItemsSection.tsx`
- Type proof: `npx tsc --noEmit`

The content CRUD table no longer adds row numbering or `정렬 n` helper text. Its default sort is back to title sorting, preserving the CRUD table behavior while DOC7-only numbering lives in the reference picker.

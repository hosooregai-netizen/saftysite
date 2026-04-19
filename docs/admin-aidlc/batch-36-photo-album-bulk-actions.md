# Admin AIDLC Batch 36: Photo Album Bulk Actions

## Why

- the photo album toolbar still depended on inline copy and split controls, which made the selection flow feel heavier than the ERP review expected
- selected photo round changes needed a focused modal flow instead of an always-visible select box
- album users needed bulk round change, download, and delete actions to share one compact action row

## What changed

- added bulk `PATCH` and `DELETE` handling to `app/api/photos/route.ts`
- added client helpers for bulk round change and bulk delete in `lib/photos/apiClient.ts`
- updated `features/photos/components/PhotoAlbumPanel.tsx` so the selection toolbar is a single row:
  - `모두 선택`
  - `선택 회차 변경`
  - `선택 다운로드`
  - `선택 삭제`
- moved round selection into a modal and kept the same-site guard inside the modal flow
- tightened the photo album card and toolbar styling in `PhotoAlbumPanel.module.css`

## Proof

- `npx eslint "features/photos/components/PhotoAlbumPanel.tsx"`
- `npx tsc --noEmit`


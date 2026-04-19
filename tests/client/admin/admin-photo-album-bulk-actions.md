# Admin Photo Album Bulk Actions Proof

## Covered behavior

- the photo album selection area is reduced to a single button row
- explanatory helper copy is removed from the selection toolbar
- round changes are triggered from a modal instead of an inline select control
- bulk download and bulk delete stay disabled until at least one photo is selected

## Validation

- `npx eslint "features/photos/components/PhotoAlbumPanel.tsx"`
- `npx tsc --noEmit`


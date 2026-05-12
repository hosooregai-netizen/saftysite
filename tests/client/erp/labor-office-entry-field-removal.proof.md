# Labor Office Entry Field Removal Proof

## Coverage

- Worker site create/edit no longer exposes the `고용부 관할(지)청` input.
- The underlying `labor_office` state and payload mapping remain intact so existing values are preserved.
- This change is UI-only and does not remove stored K2B/import-backed data.

## Verification

- `npx eslint features/admin/sections/sites/SiteEditorModal.tsx features/home/components/WorkerSiteInfoScreen.tsx`

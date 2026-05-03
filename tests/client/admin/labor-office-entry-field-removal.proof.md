# Labor Office Entry Field Removal Proof

## Coverage

- Admin site editor no longer renders a direct `노동관서` input.
- Worker site create/edit no longer renders a direct `고용부 관할(지)청` input.
- Existing `labor_office` form state and save payload remain present to preserve existing data.
- `project_kind`, `order_type_division`, and `site_code` were checked and are not exposed in these entry forms.

## Verification

- `npx eslint features/admin/sections/sites/SiteEditorModal.tsx features/home/components/WorkerSiteInfoScreen.tsx`

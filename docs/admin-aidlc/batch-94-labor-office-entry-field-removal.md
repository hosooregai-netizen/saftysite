# Batch 94: Labor Office Entry Field Removal

## Scope

- Admin site editor modal.
- Worker site create/edit form.

## What Changed

- Removed the `노동관서` input from the admin site editor operations section.
- Removed the `고용부 관할(지)청` input from the worker site create/edit form.
- Kept the existing `labor_office` state and payload mapping intact so legacy data and import-backed values are preserved instead of cleared by this UI trim.
- Confirmed `project_kind`, `order_type_division`, and `site_code` are not exposed in these entry forms.

## Verification

- `npx eslint features/admin/sections/sites/SiteEditorModal.tsx features/home/components/WorkerSiteInfoScreen.tsx`

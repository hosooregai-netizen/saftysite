# Admin AIDLC Batch 42: Site Form Trim And First Assignment Modal

## Why

- the site create/edit modal had too much helper copy and duplicated fields that overlapped with headquarter data
- the site row action menu exposed status-change shortcuts and photo album entry points that are already handled elsewhere
- newly created sites should guide the operator into field-agent assignment before the first detailed drilldown

## What changed

- `features/admin/sections/sites/SiteEditorModal.tsx` trims helper paragraphs, hides paused-only fields until the paused state is selected, and reorders contract details ahead of client details
- the site form now removes duplicate client fields that are better maintained from headquarter data while keeping the remaining site-specific contract and ordering inputs
- `features/admin/sections/sites/SitesTable.tsx` and `features/admin/sections/sites/SitesSection.tsx` remove photo album and inline status-change actions from the site action menu
- `features/admin/sections/sites/useSitesSectionState.ts`, `features/admin/sections/headquarters/HeadquartersSection.tsx`, and the admin dashboard mutation helpers now carry the created site id so the first click on a just-created site opens the field-agent assignment modal before entering the site detail
- `features/admin/sections/AdminSectionShared.module.css` keeps only the collapsible section styles still used by the trimmed modal layout

## Validation

- `npx eslint "features/admin/components/AdminDashboardSectionContent.tsx" "features/admin/hooks/buildAdminDashboardAssignmentActions.ts" "features/admin/hooks/buildAdminDashboardContentActions.ts" "features/admin/hooks/buildAdminDashboardCrudActions.ts" "features/admin/hooks/useAdminDashboardState.ts" "features/admin/sections/AdminSectionShared.module.css" "features/admin/sections/headquarters/HeadquartersSection.tsx" "features/admin/sections/sites/SiteEditorModal.tsx" "features/admin/sections/sites/SitesSection.tsx" "features/admin/sections/sites/SitesTable.tsx" "features/admin/sections/sites/siteSectionHelpers.ts" "features/admin/sections/sites/useSitesSectionState.ts"`
- `npx tsc --noEmit`
- `npm run aidlc:audit:admin`

# Admin Sites Form Trim And First Assignment Modal Proof

## Scope

- site create/edit UI no longer depends on long helper copy to explain required inputs
- duplicate client fields that overlap with headquarter information are removed from the site modal
- newly created sites open the field-agent assignment modal on the first drilldown click instead of entering the site detail immediately

## Verification

- `npx eslint "features/admin/components/AdminDashboardSectionContent.tsx" "features/admin/hooks/buildAdminDashboardAssignmentActions.ts" "features/admin/hooks/buildAdminDashboardContentActions.ts" "features/admin/hooks/buildAdminDashboardCrudActions.ts" "features/admin/hooks/useAdminDashboardState.ts" "features/admin/sections/AdminSectionShared.module.css" "features/admin/sections/headquarters/HeadquartersSection.tsx" "features/admin/sections/sites/SiteEditorModal.tsx" "features/admin/sections/sites/SitesSection.tsx" "features/admin/sections/sites/SitesTable.tsx" "features/admin/sections/sites/siteSectionHelpers.ts" "features/admin/sections/sites/useSitesSectionState.ts"`
- `npx tsc --noEmit`
- `npm run aidlc:audit:admin`

## Expected outcome

- the modal shows a tighter set of fields without the removed helper blocks and duplicate client identity fields
- paused start date only appears for paused sites, and contract details stay above client details
- the first click on a newly created site routes the operator into assignment first, then returns to the normal site-entry behavior

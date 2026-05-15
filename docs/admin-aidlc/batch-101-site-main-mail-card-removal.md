# Batch 101: Site Main Mail Card Removal

## Scope

- `features/admin/sections/headquarters/SiteManagementMainPanel.tsx`

## Change

- Removed the `메일함` action card from the shared site main panel.
- Removed the unused `mailHref` prop and the default site-scoped mailbox href calculation.
- Kept the global/admin mailbox navigation and mailbox feature routes unchanged.

## Validation

- `npx eslint features/admin/sections/headquarters/SiteManagementMainPanel.tsx`
- `npx tsc --noEmit`

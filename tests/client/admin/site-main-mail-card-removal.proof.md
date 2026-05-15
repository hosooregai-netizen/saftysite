# Site Main Mail Card Removal Proof

- Static proof: `rg "mailHref|resolvedMailHref|현장 기준 메일 작성" features/admin/sections/headquarters/SiteManagementMainPanel.tsx` returns no matches.
- Lint proof: `npx eslint features/admin/sections/headquarters/SiteManagementMainPanel.tsx`

The shared site main panel no longer renders the `메일함` action card, so the removal applies to both admin and worker site-main usages that reuse `SiteManagementMainPanel`. Other mailbox entry points remain outside this change.

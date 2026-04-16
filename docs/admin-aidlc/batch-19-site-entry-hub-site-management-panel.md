# Admin AIDLC Batch 19: Site Entry Hub — Shared Site Main Panel

## Scope

- worker site entry hub reuses `SiteManagementMainPanel` for a consistent site summary layout
- `SiteManagementMainPanel` gains optional `showSiteEditAction` (default `true`) so embedded worker views can hide the admin-only `현장 정보 수정` action

## Repo Changes

### Frontend

- `SiteManagementMainPanel`: conditional header action via `showSiteEditAction`
- `SiteEntryHubPanel`: loads assigned `SafetySite` via inspection session helpers and renders `SiteManagementMainPanel` with `showSiteEditAction={false}`
- `hooks/inspectionSessions/*`: support resolving assigned safety site data for the hub

## Navigation Contract

- full admin headquarters drilldown keeps `showSiteEditAction` default (edit link visible)
- worker site hub does not expose the admin edit route from this panel

## Proof Companion

- `tests/client/admin/admin-site-entry-hub-site-management-panel.md`
- `tests/client/erp/site-entry-hub-site-management-panel.md`

## Verification

- `npx tsc --noEmit`
- `npm run aidlc:audit:admin`
- `npm run aidlc:audit`

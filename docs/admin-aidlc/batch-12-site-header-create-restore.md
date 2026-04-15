# Admin AIDLC Batch 12: Site Header Create Restore

## Goal

Restore the primary `현장 추가` action in the site-list header so the headquarter drilldown keeps
an in-place child-site creation path.

## Scope

- `features/admin/sections/sites/SitesSection.tsx`
- `tests/client/admin/admin-sites.spec.ts`

## Contract Pack

### Feature contract

- `admin-sites`

### Mocked smoke

- `tests/client/admin/admin-sites.spec.ts`

## Implementation Record

### Actual results

- `SitesSection.tsx` now renders `현장 추가` beside the export action again.
- The site-list toolbar keeps search, filters, export, and create in one header row.
- `admin-sites` smoke now checks the current eight-column site table shape before continuing into
  the site-main flow.

## Validation Run

- `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3100 npm run test:client:smoke -- admin-sites`
  - passed
- `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3100 npm run test:client:smoke -- admin-control-center admin-headquarters admin-reports admin-sites admin-schedules admin-users`
  - passed

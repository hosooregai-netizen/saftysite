# Batch 79: Headquarter Site Registration Flow

## Scope

- Admin headquarters/sites screens and inline site creation modal.
- Worker home, headquarter assignment cards, and worker site create/edit pages.
- Safety API client types and endpoints for headquarter assignments.
- ERP/report labels for business management/start numbers and legacy contract values.

## What Changed

- Added inline headquarter search/create inside the site editor and auto-selected the newly created headquarter.
- Added admin headquarter assignment modal so workers can be assigned before a site exists.
- Added worker headquarter cards and a site create/edit form for assigned headquarters/sites.
- Removed maintenance from new contract type options and relabeled `ready` contract status as `미착수`.
- Hid duplicate site-code/management-number UI and kept legacy fallback mapping internally.

## Proof

- `npm run lint`
- `npx tsc --noEmit`

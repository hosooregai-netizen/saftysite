# Test Matrix

## PR / Push Gate

| surface | command | notes |
| --- | --- | --- |
| shared type safety | `npx tsc --noEmit --pretty false` | always run before scope smoke |
| aidlc companion check | `npm run verify:aidlc` | keeps source/doc/proof companions aligned |
| admin change subset | `npm run test:scope -- --scope admin` | runs admin smoke bundle |
| erp change subset | `npm run test:scope -- --scope erp` | runs ERP smoke bundle |
| single feature proof | `npm run test:scope -- --scope <feature_key>` | feature-level smoke rerun |

## Nightly / Release Matrix

| layer | command | coverage |
| --- | --- | --- |
| client smoke full set | `npm run test:client:smoke` | mocked admin + ERP feature proofs |
| admin real flow | `npm run smoke:real:admin` | live admin sections |
| worker/admin real flow | `npm run smoke:real:client` | live worker flow + admin photo verification |
| live contract verification | `npm run verify:erp-live` | auth/me, reports, mobile link, worker/session contracts |
| consolidated wrapper | `npm run test:nightly` | runs the full matrix in sequence |

## Scope Mapping

| scope | primary proof set |
| --- | --- |
| `admin` | `admin-control-center`, `admin-headquarters`, `admin-reports`, `admin-sites`, `admin-schedules`, `admin-users` |
| `erp` | `auth`, `site-hub`, `site-report-list`, `quarterly-report`, `bad-workplace-report`, mobile report/list/session proofs |
| feature key | exact feature smoke from `tests/client/featureContracts.ts` |

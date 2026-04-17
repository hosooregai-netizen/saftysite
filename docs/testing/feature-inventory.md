# Feature Inventory

| feature_key | surface | owner_repo | risk_level | pr_suite | nightly_suite | requires_live_dependencies | primary_proof |
| --- | --- | --- | --- | --- | --- | --- | --- |
| auth | erp login/session | saftysite-real | high | `npm run test:scope -- --scope auth` | `npm run test:nightly` | yes | `tests/client/erp/auth.spec.ts` |
| admin-overview | admin dashboard overview/control center | saftysite-real | high | `npm run test:scope -- --scope admin` | `npm run test:nightly` | yes | `tests/client/admin/admin-control-center.spec.ts` |
| admin-reports | admin reports list/open/review | saftysite-real | high | `npm run test:scope -- --scope admin` | `npm run test:nightly` | yes | `tests/client/admin/admin-reports.spec.ts` |
| admin-schedules | admin schedule board/calendar | saftysite-real | high | `npm run test:scope -- --scope admin` | `npm run test:nightly` | yes | `tests/client/admin/admin-schedules.spec.ts` |
| sites-headquarters | admin site/headquarter management | saftysite-real | medium | `npm run test:scope -- --scope admin` | `npm run test:nightly` | yes | `tests/client/admin/admin-sites.spec.ts` |
| inspection-session | worker/mobile inspection session | saftysite-real | high | `npm run test:scope -- --scope mobile-link` | `npm run test:nightly` | yes | `tests/client/erp/mobile-link.spec.ts` |
| quarterly-summary | quarterly list/report flow | saftysite-real | high | `npm run test:scope -- --scope quarterly-report` | `npm run test:nightly` | yes | `tests/client/erp/quarterly-report.spec.ts` |
| bad-workplace | bad workplace list/report flow | saftysite-real | medium | `npm run test:scope -- --scope bad-workplace-report` | `npm run test:nightly` | yes | `tests/client/erp/bad-workplace-report.spec.ts` |
| photo-content-assets | photo album and content-asset UX | saftysite-real | medium | `npm run test:scope -- --scope admin` | `npm run test:nightly` | yes | `scripts/smokeRealClient.ts` |
| document-hwpx-pdf | report export/download UI paths | saftysite-real | high | `npm run test:scope -- --scope erp` | `npm run test:nightly` | yes | `scripts/verifyErpLiveContracts.ts` |
| notifications-mail-oauth | notification center and mailbox surfaces | saftysite-real | medium | `npm run test:scope -- --scope erp` | `npm run test:nightly` | yes | `tests/client/erp/mobile-site-home.spec.ts` |

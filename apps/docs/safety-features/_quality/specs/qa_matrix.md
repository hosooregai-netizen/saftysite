# QA Matrix

| Feature | Smoke | Security | UI/Visual | Docs |
|---|---|---|---|---|
| webhard | `/webhard`, `/share/[token]` | public share boundary, permission inheritance | Drive-like layout | reverse map |
| mailbox | `/mailbox`, `/mail/connect/*` | OAuth state, token storage | three-pane mailbox | source readiness |
| report-workspace | `/reports/new`, `/reports/[id]` | workspace access, export gate | report workspace | auto-report map |
| report-list | `/reports` | workspace report list | list/filter/sort | status/export |
| headquarters-sites | `/headquarters`, `/sites` | assignment access | ERP directory | source readiness |
| photo-album | `/photo-album` | workspace/guest import | photo grid | source readiness |
| account-settings | `/account` | auth state, guest import | settings page | guest import |
| billing-credits | `/billing/*`, `/credits` | webhook idempotency | checkout/success/fail | ledger |
| auth-workspace | `/auth/*` | session/workspace guard | callback states | session modes |

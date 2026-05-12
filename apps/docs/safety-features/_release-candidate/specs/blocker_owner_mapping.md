# Blocker Owner Mapping

## 기능별 owner

| Feature | Owner group | 주요 blocker |
|---|---|---|
| auth-workspace | Auth/Platform | session, workspace guard, guest claim |
| account-settings | Auth/UX | login CTA, guest import UI, billing entry |
| billing-credits | Billing | Toss confirm/webhook, ledger, credit balance |
| report-workspace | Report | guided upload, AI draft, review/export gate |
| report-list | Report | list, status badge, export status |
| headquarters-sites | Directory | CRUD, assignment, source readiness |
| photo-album | Photo | grid/filter/upload/evidence linking |
| webhard | Drive | permission, public share, Drive-like layout |
| mailbox | Mail | OAuth, sync, 3-pane state, compose |
| _design-system | Design | visual regression, component pattern |
| _quality | QA | release gate, docs coverage |

## Blocker template

```md
## BLK-000

- Severity:
- Feature:
- Owner:
- Failing gate:
- Evidence:
- Expected:
- Actual:
- Suggested patch:
- Release decision:
```

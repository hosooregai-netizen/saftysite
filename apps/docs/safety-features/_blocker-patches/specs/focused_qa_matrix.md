# Focused QA Matrix

| Blocker Feature | Focused QA | Related Regression |
|---|---|---|
| auth-workspace | login/callback/session/workspace guard | account-settings, mailbox Gmail connect |
| billing-credits | confirm/webhook/ledger | report export |
| report-workspace | review/export/local snapshot | billing ledger, report-list |
| webhard | permission/share/public boundary | Drive-like visual, auth-workspace |
| mailbox | OAuth/account/sync/compose state | auth-workspace, report mail dispatch |
| photo-album | grid/filter/guest upload | headquarters-sites, report evidence |
| headquarters-sites | CRUD/assignment/filter | reports, photo-album, mailbox context |
| design-system | visual pattern | affected feature route smoke |
| docs/registry | route/API/schema/prompt consistency | reverse map validation |

## 공통 QA

```bash
rm -rf apps/web/.next
cd apps/web
npm run build
```

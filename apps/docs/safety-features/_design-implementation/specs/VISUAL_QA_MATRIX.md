# Visual QA Matrix

| Feature | Route | 핵심 visual QA |
|---|---|---|
| webhard | `/webhard` | Drive-like sidebar + file canvas + optional detail panel |
| webhard | `/share/[token]` | public viewer, root-relative breadcrumb |
| mailbox | `/mailbox` | sidebar/thread list/viewer/compose 구조 |
| report-workspace | `/reports/new`, `/reports/[id]` | checklist, upload steps, review queue, export gate |
| report-list | `/reports` | status/export filters, table/list empty state |
| headquarters-sites | `/headquarters`, `/sites` | ERP table, modal, quick actions |
| photo-album | `/photo-album` | grid/list/filter/detail drawer |
| account-settings | `/account` | login, guest import, billing entry 분리 |
| billing-credits | `/billing/*`, `/credits` | checkout/success/fail/ledger state |
| auth-workspace | `/auth/google/callback` | loading/error/success/guest claim state |

## 공통 accessibility

- icon-only button은 aria-label을 가진다.
- modal은 focus trap 또는 적절한 keyboard handling을 가진다.
- disabled CTA에는 이유가 보인다.
- 색상만으로 상태를 전달하지 않는다.
- empty/error/loading state에 설명 문구가 있다.

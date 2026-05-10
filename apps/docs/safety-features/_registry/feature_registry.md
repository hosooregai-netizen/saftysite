# Feature Registry

| Feature | Priority | Routes | Layout Pattern | Docs Status | Next Action |
|---|---:|---|---|---|---|
| app-home | P0 | `/` | ERP entry/home | registry patched | home/dashboard relation 확인 |
| dashboard | P1 | `/dashboard` | Dashboard overview | added in Step 16 | dashboard feature 문서화 여부 결정 |
| pricing | P1 | `/pricing` | Pricing page | added in Step 16 | billing-credits로 통합 또는 별도 pricing feature 결정 |
| webhard | P0 | `/webhard`, `/share/[token]` | Drive-like fullscreen workspace | done | 권한/공유 구현 검증 |
| mailbox | P0 | `/mailbox`, `/mail/connect/*` | Three-pane mailbox workspace | done | source recovery → Gmail OAuth/sync |
| report-workspace | P0 | `/reports/new`, `/reports/[reportId]` | ERP report workspace | done | guided upload/AI/review/export 검증 |
| report-list | P0 | `/reports` | ERP list management | done | 검색/필터/정렬 구현 |
| headquarters-sites | P0 | `/headquarters`, `/sites` | ERP directory management | done | source readiness + assignment |
| photo-album | P1 | `/photo-album` | ERP photo grid | done | source readiness + evidence linking |
| account-settings | P0 | `/account` | ERP settings page | done | guest import + billing entry 검증 |
| billing-credits | P0 | `/billing/*`, `/credits`, `/pricing` | Billing/ledger flow | done | Toss webhook + ledger idempotency |
| auth-workspace | P0 | `/auth/google/callback`, auth APIs | Auth foundation | done | workspace access guard 검증 |
| frontend-api-proxy | P0 | `/api/*` app routes | Next.js API proxy | added in Step 16 | proxy route inventory 유지 |

## Step 16 변경 사항

- `/dashboard`를 실제 route 기준으로 추가했다.
- `/pricing`을 실제 route 기준으로 추가했다.
- `/api/*` frontend proxy route를 별도 feature bucket으로 분리했다.

# Actual Frontend Route Inventory

스캔 기준: `apps(3).zip`

## Summary

| 항목 | 개수 |
|---|---:|
| `page.tsx` / `route.ts` 기반 app route | 27 |

## Actual routes

| Route | Source |
|---|---|
| `/account` | `apps/web/app/account/page.tsx` |
| `/api/admin/[...path]` | `apps/web/app/api/admin/[...path]/route.ts` |
| `/api/documents/inspection/hwpx` | `apps/web/app/api/documents/inspection/hwpx/route.ts` |
| `/api/documents/inspection/pdf` | `apps/web/app/api/documents/inspection/pdf/route.ts` |
| `/api/mail/[...path]` | `apps/web/app/api/mail/[...path]/route.ts` |
| `/api/report-saas/[...path]` | `apps/web/app/api/report-saas/[...path]/route.ts` |
| `/api/safety/[...path]` | `apps/web/app/api/safety/[...path]/route.ts` |
| `/auth/google/callback` | `apps/web/app/auth/google/callback/page.tsx` |
| `/billing/checkout` | `apps/web/app/billing/checkout/page.tsx` |
| `/billing/fail` | `apps/web/app/billing/fail/page.tsx` |
| `/billing/success` | `apps/web/app/billing/success/page.tsx` |
| `/credits` | `apps/web/app/credits/page.tsx` |
| `/dashboard` | `apps/web/app/dashboard/page.tsx` |
| `/headquarters` | `apps/web/app/headquarters/page.tsx` |
| `/mail/connect/google` | `apps/web/app/mail/connect/google/page.tsx` |
| `/mail/connect/naver-works` | `apps/web/app/mail/connect/naver-works/page.tsx` |
| `/mail/connect/naver` | `apps/web/app/mail/connect/naver/page.tsx` |
| `/mailbox` | `apps/web/app/mailbox/page.tsx` |
| `/` | `apps/web/app/page.tsx` |
| `/photo-album` | `apps/web/app/photo-album/page.tsx` |
| `/pricing` | `apps/web/app/pricing/page.tsx` |
| `/reports/[reportId]` | `apps/web/app/reports/[reportId]/page.tsx` |
| `/reports/new` | `apps/web/app/reports/new/page.tsx` |
| `/reports` | `apps/web/app/reports/page.tsx` |
| `/share/[token]` | `apps/web/app/share/[token]/page.tsx` |
| `/sites` | `apps/web/app/sites/page.tsx` |
| `/webhard` | `apps/web/app/webhard/page.tsx` |

## Registry 보강 후보

실제 route에 존재하지만 기존 Step 11 registry에서 상세 feature로 분리하지 않은 후보:

```text
/dashboard
/pricing
```

권장 처리:

- `/dashboard`: home/dashboard feature 또는 project entry feature로 registry에 추가
- `/pricing`: billing-credits 또는 pricing feature로 연결
- `/api/*` frontend proxy routes: API proxy section으로 별도 분류

# Route Registry

스캔 기준: `apps(3).zip`

## Actual frontend routes

| Route | Feature | Source |
|---|---|---|
| `/account` | account-settings | `apps/web/app/account/page.tsx` |
| `/api/admin/[...path]` | frontend-api-proxy/admin | `apps/web/app/api/admin/[...path]/route.ts` |
| `/api/documents/inspection/hwpx` | frontend-api-proxy/document-export | `apps/web/app/api/documents/inspection/hwpx/route.ts` |
| `/api/documents/inspection/pdf` | frontend-api-proxy/document-export | `apps/web/app/api/documents/inspection/pdf/route.ts` |
| `/api/mail/[...path]` | frontend-api-proxy/mailbox | `apps/web/app/api/mail/[...path]/route.ts` |
| `/api/report-saas/[...path]` | frontend-api-proxy/report-workspace | `apps/web/app/api/report-saas/[...path]/route.ts` |
| `/api/safety/[...path]` | frontend-api-proxy/safety-directory | `apps/web/app/api/safety/[...path]/route.ts` |
| `/auth/google/callback` | auth-workspace | `apps/web/app/auth/google/callback/page.tsx` |
| `/billing/checkout` | billing-credits | `apps/web/app/billing/checkout/page.tsx` |
| `/billing/fail` | billing-credits | `apps/web/app/billing/fail/page.tsx` |
| `/billing/success` | billing-credits | `apps/web/app/billing/success/page.tsx` |
| `/credits` | billing-credits | `apps/web/app/credits/page.tsx` |
| `/dashboard` | dashboard | `apps/web/app/dashboard/page.tsx` |
| `/headquarters` | headquarters-sites | `apps/web/app/headquarters/page.tsx` |
| `/mail/connect/google` | mailbox | `apps/web/app/mail/connect/google/page.tsx` |
| `/mail/connect/naver-works` | mailbox | `apps/web/app/mail/connect/naver-works/page.tsx` |
| `/mail/connect/naver` | mailbox | `apps/web/app/mail/connect/naver/page.tsx` |
| `/mailbox` | mailbox | `apps/web/app/mailbox/page.tsx` |
| `/` | app-home | `apps/web/app/page.tsx` |
| `/photo-album` | photo-album | `apps/web/app/photo-album/page.tsx` |
| `/pricing` | pricing / billing-credits | `apps/web/app/pricing/page.tsx` |
| `/reports/[reportId]` | report-workspace | `apps/web/app/reports/[reportId]/page.tsx` |
| `/reports/new` | report-workspace | `apps/web/app/reports/new/page.tsx` |
| `/reports` | report-list | `apps/web/app/reports/page.tsx` |
| `/share/[token]` | webhard | `apps/web/app/share/[token]/page.tsx` |
| `/sites` | headquarters-sites | `apps/web/app/sites/page.tsx` |
| `/webhard` | webhard | `apps/web/app/webhard/page.tsx` |

## Step 16 변경 사항

- `/dashboard` 추가
- `/pricing` 추가
- `/api/*` proxy route를 frontend-api-proxy로 분류

## 업데이트 규칙

route가 추가/삭제되면 다음 문서를 함께 업데이트한다.

- `_registry/route_registry.md`
- `_registry/feature_registry.md`
- 해당 기능 `specs/reverse_map.md`
- 해당 기능 `specs/data_flow.md`

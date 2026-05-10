# Frontend API Proxy Route Registry

Next.js `app/api/*` route는 화면 기능 route가 아니라 backend/API bridge다.

| Proxy Route | Feature Group | Source |
|---|---|---|
| `/api/admin/[...path]` | frontend-api-proxy/admin | `apps/web/app/api/admin/[...path]/route.ts` |
| `/api/documents/inspection/hwpx` | frontend-api-proxy/document-export | `apps/web/app/api/documents/inspection/hwpx/route.ts` |
| `/api/documents/inspection/pdf` | frontend-api-proxy/document-export | `apps/web/app/api/documents/inspection/pdf/route.ts` |
| `/api/mail/[...path]` | frontend-api-proxy/mailbox | `apps/web/app/api/mail/[...path]/route.ts` |
| `/api/report-saas/[...path]` | frontend-api-proxy/report-workspace | `apps/web/app/api/report-saas/[...path]/route.ts` |
| `/api/safety/[...path]` | frontend-api-proxy/safety-directory | `apps/web/app/api/safety/[...path]/route.ts` |

## 관리 기준

- proxy route는 feature route smoke와 구분한다.
- backend endpoint와 연결되는 경우 `_registry/api_registry.md`에도 반영한다.
- document export bridge는 report-workspace/export dispatch와 연결한다.

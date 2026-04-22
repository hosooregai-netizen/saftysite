# Admin AIDLC Batch 51: Login Landing And Worker Navigation Priority

## Scope

- `features/admin/hooks/useAdminScreenState.ts`
- `hooks/inspectionSessions/useInspectionSessionAuthSync.ts`
- `lib/auth/postLoginRedirect.ts`
- `features/home/hooks/useHomeScreenState.ts`
- `features/calendar/components/WorkerCalendarScreen.tsx`
- `components/worker/workerMenuConfig.ts`
- `features/mobile/site-list/mobileSiteListTabs.tsx`
- `tests/client/admin/admin-login-landing-overview.md`
- `tests/client/erp/worker-login-landing-and-nav-order.md`

## Intent

- send admin and controller accounts to `/admin?section=overview` immediately after login
- send worker accounts to `/calendar` immediately after login
- move the worker `내 일정` entry to the top of the desktop worker menu
- move the mobile worker `일정` tab to the far-left position

## Validation

- `npx eslint "./lib/auth/postLoginRedirect.ts" "./hooks/inspectionSessions/useInspectionSessionAuthSync.ts" "./features/home/hooks/useHomeScreenState.ts" "./features/admin/hooks/useAdminScreenState.ts" "./features/calendar/components/WorkerCalendarScreen.tsx" "./components/worker/workerMenuConfig.ts" "./features/mobile/site-list/mobileSiteListTabs.tsx"`

## Notes

- post-login routing uses a one-time `sessionStorage` hint so the redirect only affects the first screen after a successful login
- the existing role guards remain in place after the first landing redirect is consumed

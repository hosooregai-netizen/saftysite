## Admin Proof Note

- Scope: `app/admin/report-open/page.tsx`
- Intent:
  - prevent prerender failure for `/admin/report-open` in Vercel production builds
  - keep client-side `reportKey` parsing via `useSearchParams()` inside a `Suspense` boundary
- Checks:
  - `npm run build`
  - `npx tsc --noEmit --pretty false`

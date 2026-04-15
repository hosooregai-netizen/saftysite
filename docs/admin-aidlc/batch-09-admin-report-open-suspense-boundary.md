# Batch 09 - Admin report-open suspense boundary

## Why

- Vercel production build failed on `/admin/report-open` during prerender.
- The page uses `useSearchParams()`, which requires a `Suspense` boundary in Next.js app router builds.

## Repo changes

- `app/admin/report-open/page.tsx`
  - split page logic into `AdminReportOpenPageContent`
  - wrapped exported page with `<Suspense>` and fallback UI
  - kept existing runtime behavior for login/session bootstrap/pdf fallback path

## Verification

- `npm run build`
- `npx tsc --noEmit --pretty false`
- `npm run aidlc:audit:admin`

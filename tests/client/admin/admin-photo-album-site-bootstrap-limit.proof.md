# Admin Photo Album Site Bootstrap Limit Proof

- scope: admin photo album first load should not fetch the full active site directory before rendering the 20-row album page
- browser proof: Playwright loaded `/admin?section=photos` with a fresh auth/session cache and observed one site bootstrap request, `/api/safety/sites?active_only=true&include_headquarter_detail=true&include_assigned_user=true&limit=100&offset=0`
- API proof: `/api/photos?all=false&source=album_upload&limit=20&offset=0&sort_by=capturedAt&sort_dir=desc` returned 20 rows in 0.18s locally
- static proof: `npx eslint --ignore-pattern 'reverse-rebuild/**' features/admin/hooks/useAdminDashboardDataLoaders.ts features/admin/hooks/useAdminDashboardRouting.ts`
- type proof: `npx tsc --noEmit --pretty false`

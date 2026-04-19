# Admin AIDLC Batch 32: Headquarters Context Restore and List Source of Truth

## Scope

- `components/admin/AdminMenu.tsx`
- `features/admin/sections/headquarters/**`
- `app/api/admin/headquarters/list/route.ts`
- `server/admin/adminDirectoryLists.ts`
- `tests/client/admin/admin-sites.spec.ts`
- `types/controller.ts`

## Intent

- treat the route `siteId` as the site-main source of truth so quick links do not keep rendering the previous site's report, quarterly, photo, and bad-workplace routes during admin site switches
- ignore late site-detail responses after a newer site selection so stale `selectedSite` data cannot overwrite the current route context

- keep the current site context when an admin uses the left menu `현장 메인` entry from report and workspace screens
- recover `headquarterId` when `/admin?section=headquarters&siteId=...` is opened without the canonical site-main query shape
- move headquarters list `순번` and `현장 수` to server-derived values so the admin list no longer depends on missing client-side core data

## Validation

- `npx tsc --noEmit`
- `npx tsx tests/client/runSmoke.ts admin-sites site-report-list`

- `npm run build`

## Notes

- site-main quick links now derive from the current `headquarterId/siteId` selection and the already-loaded headquarter site list before any slower detail refetch resolves

- the top-level `사업장 / 현장` menu entry still behaves as the list entry point; only the `현장 메인` submenu preserves the current site context
- site-main canonical admin URLs remain `/admin?section=headquarters&headquarterId={hqId}&siteId={siteId}`
- headquarters list rows now carry derived `sequence_no` and `site_count` fields from the list API response instead of UI-only calculation

# Admin AIDLC Batch 32: Headquarters Context Restore and List Source of Truth

## Scope

- `components/admin/AdminMenu.tsx`
- `features/admin/sections/headquarters/**`
- `app/api/admin/headquarters/list/route.ts`
- `server/admin/adminDirectoryLists.ts`
- `types/controller.ts`

## Intent

- keep the current site context when an admin uses the left menu `현장 메인` entry from report and workspace screens
- recover `headquarterId` when `/admin?section=headquarters&siteId=...` is opened without the canonical site-main query shape
- move headquarters list `순번` and `현장 수` to server-derived values so the admin list no longer depends on missing client-side core data

## Validation

- `npm run build`

## Notes

- the top-level `사업장 / 현장` menu entry still behaves as the list entry point; only the `현장 메인` submenu preserves the current site context
- site-main canonical admin URLs remain `/admin?section=headquarters&headquarterId={hqId}&siteId={siteId}`
- headquarters list rows now carry derived `sequence_no` and `site_count` fields from the list API response instead of UI-only calculation

# Admin AIDLC Batch 45: Headquarters Upstream Proxy Alignment

## Scope

- `app/api/admin/headquarters/list/route.ts`
- `app/api/admin/headquarters/list/getHandler.ts`
- `app/api/admin/headquarters/list/route.test.ts`
- `tests/client/admin/admin-headquarters.spec.ts`
- `types/backend.ts`

## Intent

- switch the general admin headquarters list path to the cached safety-server `/admin/headquarters/list` upstream instead of rebuilding from full headquarters and sites reads on every page change
- preserve the current UI contract for active-only rows, `created_at desc` paging, stable `sequence_no`, correct `site_count`, and id-based headquarter context restore
- keep a degraded local fallback only for upstream 5xx errors on the general list path

## Validation

- `npx tsx --test app/api/admin/headquarters/list/route.test.ts`
- `npx tsc --noEmit`
- `npx eslint app/api/admin/headquarters/list/getHandler.ts app/api/admin/headquarters/list/route.ts app/api/admin/headquarters/list/route.test.ts tests/client/admin/admin-headquarters.spec.ts types/backend.ts`
- `npx tsx tests/client/runSmoke.ts admin-headquarters`

## Notes

- `route.ts` is now a thin export-only Next route so the list logic can be exercised through `getHandler.ts` without violating Next route export constraints
- the admin headquarters smoke now seeds more than one page of rows so the pass condition covers page 2 transitions and export-time `site_count` preservation

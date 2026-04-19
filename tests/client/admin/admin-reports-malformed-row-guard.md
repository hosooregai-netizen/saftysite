# Admin Reports Malformed Row Guard Proof

## Scope

- admin reports route mapping
- malformed row tolerance in `server/admin/upstreamMappers.ts`

## Verification

- added `server/admin/upstreamMappers.test.ts`
- verified with:
  - `npx tsx --test server/admin/upstreamMappers.test.ts server/admin/reportsRouteCache.test.ts server/admin/safetyApiServer.test.ts`
  - `npx eslint server/admin/upstreamMappers.ts server/admin/upstreamMappers.test.ts`

## Expected outcome

- malformed or null rows do not crash `/api/admin/reports`
- valid rows continue to render normally

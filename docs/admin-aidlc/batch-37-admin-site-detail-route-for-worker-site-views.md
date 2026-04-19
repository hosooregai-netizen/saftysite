# Admin AIDLC Batch 37: Admin Site Detail Route For Worker Site Views

## Scope

- `app/api/admin/sites/[siteId]/route.ts`
- `lib/admin/apiClient.ts`
- `tests/client/admin/admin-sites.spec.ts`
- `tests/client/contracts/adminContracts.ts`
- `tests/client/fixtures/adminSmokeHarness.ts`

## Intent

- allow admin-authenticated worker pages such as `/sites/:siteId` to resolve a full `SafetySite`
  record without falling back to stale local cache
- make the admin site detail API an explicit smoke contract path instead of an implicit dependency
  hidden behind `sites/list`

## Proof Companion

- `tests/client/admin/admin-sites.spec.ts`
- `tests/client/contracts/adminContracts.ts`
- `tests/client/fixtures/adminSmokeHarness.ts`

## Verification

- `npx tsc --noEmit`
- `npm run aidlc:audit:admin`
- `npm run test:client:smoke -- admin-sites`

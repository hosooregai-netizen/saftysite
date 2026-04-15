# Admin AIDLC Batch 10: Site Status Soft Delete Alignment

## Scope

- align admin site status handling with the safety-server source of truth
- keep `planned` as the default creation status for sites
- treat site deletion as `deleted` soft-delete instead of `closed`
- hide `deleted` sites from admin lists, lookups, schedule drilldowns, and summary views

## Repo Changes

### Frontend

- accept `deleted` as a valid upstream site status without normalizing it back to `active`
- keep the visible admin site filter to `all | planned | active | closed`
- refresh headquarter drilldown site state after create, update, and delete mutations
- align smoke client site creation defaults to `planned`

### Server Contract Dependence

- assumes the safety-server now returns site `status` as the single source of truth
- assumes `DELETE /sites/:id` transitions the site to `deleted`
- assumes admin list and lookup endpoints exclude `deleted` rows by default

## Proof Companion

- `tests/client/contracts/adminContracts.ts`
  - extended `admin-headquarters` and `admin-sites` contract language for:
    - planned default creation
    - deleted hidden behavior
    - drilldown refresh after site mutation

## Verification

- `npx tsc --noEmit`
- `npm run aidlc:audit:admin`

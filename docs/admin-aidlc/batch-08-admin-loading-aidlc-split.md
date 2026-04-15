# Batch 08 - Admin loading refactor and AIDLC scope split

## Why

- `/admin` runtime was still paying for `fetchAdminCoreData()` in a few high-traffic paths even after section-level lazy loading started.
- `users / headquarters / sites` already had client pagination UX, but the protection layer was still too monolithic:
  - `tests/client/featureContracts.ts` mixed admin and ERP contracts
  - `verifyAidlcPush.mjs` mapped many admin edits to the same broad smoke bundle
  - `app/api/admin`, `server/admin`, and `lib/admin/apiClient.ts` changes were not guarded consistently

## Repo changes

- kept and stabilized section-level directory pagination:
  - `GET /api/admin/users/list`
  - `GET /api/admin/headquarters/list`
  - `GET /api/admin/sites/list`
  - `GET /api/admin/directory/lookups`
- standardized server-side directory reuse:
  - `server/admin/adminDirectorySnapshot.ts`
  - `server/admin/adminDirectoryLists.ts`
- removed remaining `fetchAdminCoreData()` use from high-frequency admin paths where only directory data is needed:
  - `app/api/admin/dashboard/overview/route.ts`
  - `app/api/admin/schedules/[scheduleId]/route.ts`
  - `app/api/admin/sites/[siteId]/schedules/generate/route.ts`
  - `server/admin/exportSheets.ts`
- split feature contracts by domain:
  - `tests/client/contracts/adminContracts.ts`
  - `tests/client/contracts/erpContracts.ts`
  - `tests/client/contracts/shared.ts`
  - `tests/client/featureContracts.ts` now acts as a thin registry
- split admin mocked smoke coverage into smaller entry points:
  - `tests/client/admin/admin-users.spec.ts`
  - `tests/client/admin/admin-headquarters.spec.ts`
  - `tests/client/admin/admin-schedules.spec.ts`
  - `tests/client/admin/admin-sites.spec.ts` now focuses on site CRUD/site main only
- updated mocked harness to understand the new paged list APIs:
  - `tests/client/fixtures/adminSmokeHarness.ts`
- narrowed AIDLC verification scope:
  - `scripts/verifyAidlc.mjs`
  - `scripts/verifyAidlcPush.mjs`
  - `scripts/aidlcAudit.mjs`

## Protection changes

- `verifyAidlc.mjs` now treats these as guarded admin source too:
  - `app/api/admin/**`
  - `app/api/safety/**`
  - `server/admin/**`
  - `lib/admin/apiClient.ts`
- admin proof companions can now come from admin contract packs instead of the old single-file contract registry.
- `verifyAidlcPush.mjs` now maps section files more narrowly:
  - `users -> admin-users`
  - `headquarters -> admin-headquarters`
  - `sites -> admin-sites`
  - `schedules -> admin-schedules`
  - `reports -> admin-reports`
  - `overview/analytics shared controller paths -> admin-control-center`
- truly shared admin plumbing still fans out to the full admin smoke set.
- `reports` row mutations now patch the cached row in-place instead of rebuilding from an unstaged site array dependency.
  - this avoids client-side crashes in `/admin?section=reports`
  - and keeps dispatch/review actions from forcing an unnecessary `GET /api/admin/reports` refetch

## Upstream index request

This repo cannot apply upstream DB migrations directly, but the runtime changes above assume the following companion index work on the safety API side:

- `users`
  - `(is_active, role, name)`
  - `(is_active, email)`
- `headquarters`
  - `(is_active, name)`
  - `(management_number)`
  - `(opening_number)`
  - `(business_registration_no)`
- `sites`
  - `(is_active, headquarter_id, status)`
  - `(site_name)`
  - `(management_number)`
  - `(site_code)`
  - `(last_visit_date)`
- `assignments`
  - `(is_active, user_id)`
  - `(is_active, site_id)`
  - unique-like constraint on `(site_id, user_id)` if upstream allows it
- `reports`
  - `(is_deleted, site_id, updated_at desc)` or equivalent active-only filter index
  - `(report_type, updated_at desc)`
  - `(assignee_user_id, updated_at desc)`
  - `(quality_status, updated_at desc)`

## Verification

- `npx tsc --noEmit --pretty false`
- `npm run aidlc:audit:admin`
- `git diff --check`
- mocked smoke:
  - `admin-control-center`
  - `admin-headquarters`
  - `admin-users`
  - `admin-sites`
  - `admin-schedules`
  - `admin-reports`
- focused reports regression check:
  - `/admin?section=reports` loads without `sites is not defined`
  - review/dispatch patch the visible row without a full list refetch

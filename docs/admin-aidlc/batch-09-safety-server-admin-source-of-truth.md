# Batch 09 - safety-server Admin Source Of Truth

## Scope

- Move admin directory list/list-lookup/calendar-query responsibility from Next local snapshot builders to `safety-server`
- Keep `saftysite-real` as thin proxy + 5 minute session cache
- Add server-side cache/index support on `safety-server`

## Repo Changes

### `safety-server`

- Added admin list APIs
  - `GET /admin/users/list`
  - `GET /admin/headquarters/list`
  - `GET /admin/sites/list`
  - `GET /admin/directory/lookups`
- Added schedule board APIs
  - `GET /admin/schedules/calendar`
  - `GET /admin/schedules/queue`
  - `GET /admin/schedules/lookups`
- Added shared server caches
  - `adminDirectorySnapshot`
  - `scheduleBoardSnapshot`
  - existing admin cache TTL normalized to 60s
- Added admin mutation invalidation for
  - users
  - headquarters
  - sites
  - assignments
  - reports
  - excel imports
- Added startup index coverage for admin-heavy query paths

### `saftysite-real`

- Switched these routes to upstream passthrough + mapper
  - `/api/admin/users/list`
  - `/api/admin/headquarters/list`
  - `/api/admin/sites/list`
  - `/api/admin/directory/lookups`
  - `/api/admin/schedules/calendar`
  - `/api/admin/schedules/queue`
  - `/api/admin/schedules/lookups`
  - `/api/admin/dashboard/overview`
  - `/api/admin/dashboard/analytics`
- Reduced `/api/admin/reports` path to direct upstream reports query instead of local directory-wide refiltering
- Extended backend/admin mappers and backend types for new upstream response shapes

## Upstream Index Request

Applied in `safety-server/app/services/indexes.py`.

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
  - `(site_id, user_id)` uniqueness already enforced server-side
- `reports`
  - `(is_deleted, site_id, updated_at desc)`
  - `(report_type, updated_at desc)`
  - `(assigned_user_id, updated_at desc)`
  - `(review.quality_status, updated_at desc)`

## Verification

- `safety-server`
  - `python3 -m py_compile ...`
  - `python3 -m unittest tests.test_admin_directory_schedule_board`
- `saftysite-real`
  - `npx tsc --noEmit --pretty false`
  - `npm run aidlc:audit:admin`
  - admin smoke packs after local app start

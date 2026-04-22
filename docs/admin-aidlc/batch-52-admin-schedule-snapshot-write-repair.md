# Batch 52 - Admin Schedule Snapshot Write Repair

## Scope

- admin schedule calendar and queue read-path stabilization
- controller schedule save fallback into site memo
- legacy calendar chip secondary-line cleanup

## What Changed

- updated `app/api/admin/schedules/calendar/route.ts`
- updated `app/api/admin/schedules/queue/route.ts`
- updated `app/api/admin/schedules/[scheduleId]/route.ts`
- updated `app/api/admin/sites/[siteId]/schedules/generate/route.ts`
- updated `features/admin/sections/AdminSectionShared.module.css`
- updated legacy sync helpers so memo-backed repairs can clear stale selected rows

## Why

- some upstream selected schedule rows were not mutating even when PATCH returned success
- the controller schedules screen needs a read path that reflects memo-backed repairs and controller saves immediately
- older calendar chip markup could still expose a secondary small-text line in stale bundles

## Validation

- `pnpm exec eslint app/api/admin/schedules/calendar/route.ts app/api/admin/schedules/queue/route.ts 'app/api/admin/schedules/[scheduleId]/route.ts' 'app/api/admin/sites/[siteId]/schedules/generate/route.ts' tests/client/contracts/adminContracts.ts`
- `python3 -m py_compile scripts/legacy_insafed/import_new_erp.py scripts/legacy_insafed/cutover_schedule_sync.py`
- `pnpm exec tsx tests/client/runSmoke.ts admin-schedules`

## Notes

- calendar and queue routes now read from the local admin schedule snapshot instead of the upstream calendar endpoints
- schedule PATCH still calls upstream, but now also persists the same change into the site memo so the snapshot-backed board does not get stuck on stale selected rows

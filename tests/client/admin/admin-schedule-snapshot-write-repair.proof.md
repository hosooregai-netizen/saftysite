# Admin Schedule Snapshot Write Repair Proof

## Covered Change

- `app/api/admin/schedules/calendar/route.ts`
- `app/api/admin/schedules/queue/route.ts`
- `app/api/admin/schedules/[scheduleId]/route.ts`
- `app/api/admin/sites/[siteId]/schedules/generate/route.ts`
- `features/admin/sections/AdminSectionShared.module.css`

## Expected Result

- admin calendar and queue reads reflect the memo-backed snapshot rows
- saving a controller schedule updates the site memo-backed snapshot even if upstream selected rows lag or ignore the mutation
- calendar chips show only the primary `[지도요원명] 현장명` line

## Validation Notes

- `pnpm exec eslint app/api/admin/schedules/calendar/route.ts app/api/admin/schedules/queue/route.ts 'app/api/admin/schedules/[scheduleId]/route.ts' 'app/api/admin/sites/[siteId]/schedules/generate/route.ts' tests/client/contracts/adminContracts.ts`
- `python3 -m py_compile scripts/legacy_insafed/import_new_erp.py scripts/legacy_insafed/cutover_schedule_sync.py`
- `pnpm exec tsx tests/client/runSmoke.ts admin-schedules`

## Manual Review

- verified calendar and queue routes call the snapshot builders instead of upstream passthrough helpers
- verified schedule PATCH also writes the computed memo update back to the owning site
- verified chip secondary meta text is hidden in shared admin schedule styles

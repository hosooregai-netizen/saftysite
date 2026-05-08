# Batch 100: Admin Schedules Initial Loading

## Scope

- `features/admin/sections/schedules/SchedulesSection.tsx`
- `lib/admin/apiClient.ts`
- `app/api/admin/schedules/queue/route.ts`
- `server/admin/scheduleSnapshot.ts`
- `server/admin/scheduleSnapshot.test.ts`

## Change

- Calendar view now loads the calendar snapshot first without immediately loading the full unselected queue.
- Queue rows load lazily for list view with page-sized `limit` and `offset` instead of the previous `limit=5000` first-load request.
- Schedule lookups keep the existing session cache key and share an in-flight request during remounts.
- Next schedule snapshot backend reads are split so calendar responses call backend calendar only, and queue responses call backend queue only.
- Queue UI distinguishes not-yet-loaded, loading, loaded-empty, and error states so counts do not look like false zeroes.

## Validation

- `npx eslint features/admin/sections/schedules/SchedulesSection.tsx server/admin/scheduleSnapshot.ts app/api/admin/schedules/calendar/route.ts app/api/admin/schedules/queue/route.ts app/api/admin/schedules/lookups/route.ts lib/admin/apiClient.ts`
- `npx tsx --test server/admin/scheduleSnapshot.test.ts`
- `.\\.venv\\Scripts\\python.exe -m pytest tests\\test_admin_directory_schedule_board.py tests\\test_schedule_merge.py -q`

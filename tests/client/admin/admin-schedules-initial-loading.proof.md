# Admin Schedules Initial Loading Proof

## Scenario

- Calendar view initial load no longer calls the queue endpoint from `SchedulesSection`.
- List view and direct `view=list` entry load queue rows with `QUEUE_PAGE_SIZE` and the matching page offset.
- Snapshot builders no longer amplify backend calls by loading both backend calendar and backend queue for each Next route.

## Evidence

- Static inspection: queue fetch is guarded by `viewMode === 'list'`, and the queue request includes `limit: QUEUE_PAGE_SIZE` plus page offset.
- Unit coverage: `server/admin/scheduleSnapshot.test.ts` verifies calendar responses do not call the backend queue loader and queue responses do not call the backend calendar loader.
- Validation commands run:
  - `npx eslint features/admin/sections/schedules/SchedulesSection.tsx server/admin/scheduleSnapshot.ts app/api/admin/schedules/calendar/route.ts app/api/admin/schedules/queue/route.ts app/api/admin/schedules/lookups/route.ts lib/admin/apiClient.ts`
  - `npx tsx --test server/admin/scheduleSnapshot.test.ts`
  - `.\\.venv\\Scripts\\python.exe -m pytest tests\\test_admin_directory_schedule_board.py tests\\test_schedule_merge.py -q`

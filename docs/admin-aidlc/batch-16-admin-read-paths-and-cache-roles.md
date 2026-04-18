# Batch 16: Admin Canonical Read Paths and Cache Roles

## Goal

- Reduce split-brain risk between direct fetch, snapshot, route cache, and client session cache.
- Keep current UI behavior while making the intended source-of-truth path explicit.

## Canonical Read Paths

| Domain | Canonical UI read path | Notes |
| --- | --- | --- |
| overview | `/api/admin/dashboard/overview` | Direct upstream fetch via Next route. Client session cache is SWR-style display optimization only. |
| reports | `/api/admin/reports` | Direct upstream fetch via Next route. Server route cache may short-cache keyed list responses. |
| analytics | `/api/admin/dashboard/analytics` | Direct upstream fetch via Next route. `analyticsSnapshot` is not the main UI source of truth. |
| schedules | `/api/admin/schedules/calendar`, `/api/admin/schedules/queue`, `/api/admin/schedules/lookups` | Direct upstream fetch via dedicated routes. `/api/admin/schedules` is a legacy snapshot-backed aggregate route. |

## Snapshot Roles

- `analyticsSnapshot`
  - export helper input
  - explicit snapshot refresh endpoint
  - legacy/shared warm-up path
  - not the canonical dashboard analytics GET source
- `scheduleSnapshot`
  - legacy aggregate schedules route support
  - mutation helper warm-up
  - not the canonical schedules section read source
- `adminDirectorySnapshot`
  - shared derived source for export/snapshot helpers
  - not a replacement for section GET routes

## Cache Roles

- client session cache
  - instant re-entry and stale-while-revalidate display optimization
  - should never be treated as the authoritative source
- Next route cache
  - lightweight request dedupe or short TTL list caching
  - should sit in front of canonical GET paths only
- snapshot cache
  - shared expensive source reuse for export/legacy helpers
  - should not compete with canonical UI GET routes

## Bootstrap Cache Namespace

- dashboard bootstrap caches now live under:
  - `bootstrap:report-list`
  - `bootstrap:sites-data`
  - `bootstrap:mailbox-directory`
- section-owned caches remain separate:
  - `overview`
  - `reports:*`
  - `analytics:*`
  - `schedule-calendar:*`
  - `schedule-queue:*`
  - `schedule-lookups`

## Remaining Debt

- analytics snapshot refresh is still kept for export/legacy support even though the UI reads direct data
- schedules still expose both canonical direct-fetch routes and a legacy aggregate snapshot route
- export still mixes snapshot-backed and direct-fetch-backed sources depending on section

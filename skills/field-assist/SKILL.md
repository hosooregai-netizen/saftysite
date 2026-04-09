---
name: field-assist
description: Use for 지도요원 현장 작업 flows such as worker calendar handoff and worker photo album usage.
---

# Field Assist

Use this skill when the task affects mobile-first worker flows.

## Focus

- `/calendar`
- worker photo album usage

## Primary entry points

- `features/calendar/components/WorkerCalendarScreen.tsx`
- `features/photos/components/SitePhotoAlbumScreen.tsx`
- `app/api/me/**`, `app/api/photos/**`

## Workflow

1. Keep worker access limited to assigned sites.
2. Treat worker mobile flows as narrow execution paths tied to the selected site or schedule.
3. When entering from schedule context, preserve `schedule_id` where the target screen still supports it.
4. If the task touches `scripts/`, keep each touched script file at `<= 200` lines by splitting helpers into sibling files instead of growing one long script.

## Validation

- Assigned worker can open the target worker screen for the site or schedule.
- Unassigned worker is blocked from protected site photos.
- Photo uploads are immediately visible after re-entry.

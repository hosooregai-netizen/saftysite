---
name: field-assist
description: Use for 지도요원 현장 보조 features such as worker calendar handoff, site assist, photo upload, field signature, and site manager contact flows.
---

# Field Assist

Use this skill when the task affects mobile-first worker flows.

## Focus

- `/calendar`
- `/sites/[siteKey]/assist`
- worker photo album usage
- field signatures
- site manager contact display

## Primary entry points

- `features/calendar/components/WorkerCalendarScreen.tsx`
- `features/assist/components/SiteAssistScreen.tsx`
- `features/photos/components/SitePhotoAlbumScreen.tsx`
- `app/api/me/**`, `app/api/photos/**`
- `app/routers/sites.py` and field signature services in `safety-server`

## Workflow

1. Keep worker access limited to assigned sites.
2. Treat assist as a narrow execution flow:
   - previous photos
   - photo upload
   - signature
   - manager contact
3. Prefer the real `manager_phone` field; use legacy contact snapshots only as fallback.
4. When entering from schedule context, preserve `schedule_id`.
5. If the task touches `scripts/`, keep each touched script file at `<= 200` lines by splitting helpers into sibling files instead of growing one long script.

## Validation

- Assigned worker can open assist for the target site.
- Unassigned worker is blocked from assist, signatures, and site photos.
- Upload and signature save are immediately visible after re-entry.
- Contact action uses a valid `tel:` link only when the phone number is dialable.

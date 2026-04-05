---
name: controller-ops
description: Use for 관제 운영 작업 such as 대시보드, 전체 보고서, 일정 운영, 알림 확인, and admin smoke checks across `/admin`.
---

# Controller Ops

Use this skill when the task primarily touches the admin control center.

## Focus

- `overview`, `reports`, `analytics`, `schedules`, `photos`, `mailbox`, `k2b`
- admin routing and filters under `/admin`
- controller-only status changes such as quality check, dispatch, and schedule overrides

## Primary entry points

- `features/admin/components/AdminDashboardScreen.tsx`
- `features/admin/hooks/useAdminDashboardState.ts`
- `features/admin/sections/**`
- `app/api/admin/**`
- `server/admin/**`

## Workflow

1. Confirm whether the change belongs in admin UI, admin API, or both.
2. Keep controller actions server-validated even if the UI already hides them.
3. For list screens, preserve shared `TableToolbar` behavior: search, filter, sort, export.
4. Re-run the real-client smoke path for the affected `/admin` section.
5. If the task touches `scripts/`, keep each touched script file at `<= 200` lines by splitting helpers into sibling files instead of growing one long script.

## Validation

- Admin page renders without auth flicker or section mismatch.
- Section-specific API calls return `200`.
- Search/sort/export still reflect the visible dataset.
- If the task affects controller workflows, update `scripts/smokeRealClient.ts`.

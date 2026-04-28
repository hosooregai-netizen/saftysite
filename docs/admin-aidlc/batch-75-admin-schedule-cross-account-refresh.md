# Batch 75 - Admin Schedule Cross Account Refresh

## Scope

- admin schedule calendar/list refresh behavior after worker account schedule edits
- cross-account visibility for worker-selected schedule dates

## What Changed

- changed the admin schedule section to always revalidate calendar and queue data instead of stopping on fresh session cache
- added focus, visibility, and 30-second refresh triggers so an open admin account can pick up worker account schedule changes

## Why

- worker accounts are the source of schedule registration/editing, while admin accounts review the resulting schedule board
- session cache could keep the admin schedule screen on stale rows after a worker saved a date in another account

## Validation

- `npx eslint features/admin/sections/schedules/SchedulesSection.tsx`

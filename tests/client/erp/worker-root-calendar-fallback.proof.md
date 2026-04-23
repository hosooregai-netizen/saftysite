# ERP Worker Root Calendar Fallback Proof

## Scenario

- The shared root route `/` remains the common ERP entry point.
- Worker login already writes a one-time redirect to `/calendar`.
- After that one-time redirect is consumed, revisiting `/` while still authenticated as a worker should still land on the calendar instead of the site list.

## Expected Result

- The first worker redirect after login still lands on `/calendar`.
- Revisiting `/` while authenticated as a worker redirects to `/calendar`.
- The shared root no longer falls back to the worker `현장 목록` screen for authenticated worker users.

## Commands Run

- `npx eslint features/home/hooks/useHomeScreenState.ts`
- `npx tsc --noEmit --pretty false`


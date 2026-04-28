# ERP Worker Root Site List Proof

## Scenario

- The shared root route `/` remains the common ERP entry point.
- Worker login already writes a one-time redirect to `/calendar`.
- After that one-time redirect is consumed, revisiting `/` while still authenticated as a worker should show the site list.
- The worker menu `사업장 / 현장` item links to `/`, so direct navigation to `/` must not bounce back to `내 일정`.

## Expected Result

- The first worker redirect after login still lands on `/calendar`.
- Revisiting `/` while authenticated as a worker keeps the worker on the site list.
- The shared root still sends admin users to `/admin?section=overview`.

## Commands Run

- `npx eslint features/home/hooks/useHomeScreenState.ts features/home/hooks/useHomeScreenState.test.ts`
- `npx tsx --test features/home/hooks/useHomeScreenState.test.ts`

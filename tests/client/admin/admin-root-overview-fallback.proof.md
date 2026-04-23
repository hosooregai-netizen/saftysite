# Admin Root Overview Fallback Proof

## Scenario

- The shared root route `/` is used as a common entry point.
- Admin login already stores a one-time redirect to `/admin?section=overview`.
- After that redirect is consumed, revisiting `/` should still land on the overview dashboard instead of `사업장/현장`.

## Expected Result

- The first admin redirect after login still lands on `/admin?section=overview`.
- Visiting `/` again while still authenticated as admin redirects to the overview dashboard.
- The root route no longer falls back to the headquarters section for authenticated admin users.

## Commands Run

- `npx eslint features/home/hooks/useHomeScreenState.ts`
- `npx tsc --noEmit --pretty false`


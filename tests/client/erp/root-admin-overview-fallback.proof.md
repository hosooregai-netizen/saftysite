# ERP Root Admin Overview Fallback Proof

## Scenario

- The shared root route `/` is still used as the common ERP entry.
- Admin login writes a one-time redirect to `/admin?section=overview`.
- After that one-time redirect is consumed, revisiting `/` while authenticated as admin should still land on overview instead of the headquarters screen.

## Expected Result

- The first admin redirect after login still lands on `/admin?section=overview`.
- Revisiting `/` while authenticated as admin redirects to the overview dashboard.
- The shared root no longer falls back to `사업장/현장` for authenticated admin users.

## Commands Run

- `npx eslint features/home/hooks/useHomeScreenState.ts`
- `npx tsc --noEmit --pretty false`


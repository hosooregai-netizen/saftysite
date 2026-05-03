# Admin Overview Ending And Material Data Load Proof

- Static proof: `npx tsx --test features/admin/sections/overview/useAdminOverviewSectionState.test.ts`
- Static proof: `npm run lint`
- Verified the admin overview merge layer restores fallback ending-soon rows when upstream rows are partial.
- Verified the quarterly material-gap table restores fallback missing-site rows when upstream summary counts exist without row payloads.


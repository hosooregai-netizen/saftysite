---
name: admin-contract-pack
description: Use for /admin client work in saftysite-real that must update admin feature contracts, mocked Playwright smoke, real admin smoke, admin audit scope, and an admin batch spec/record together.
---

# Admin Contract Pack

Use this skill for `/admin` modularization, dashboard refactors, section splits, and admin smoke work.

## Focus

- `features/admin/**`
- `app/admin/**`
- `tests/client/admin/**`
- `tests/client/fixtures/adminSmokeHarness.ts`
- `scripts/smoke-real-client/admin-sections/**`
- `scripts/smokeRealAdmin.ts`
- `docs/admin-aidlc/**`

## Workflow

1. Update or create the active batch doc under `docs/admin-aidlc/`.
2. Update the matching admin contracts in `tests/client/featureContracts.ts`.
3. Update mocked admin smoke in `tests/client/admin/**`.
4. Update real admin smoke in `scripts/smoke-real-client/admin-sections/**` or `scripts/smokeRealAdmin.ts`.
5. Update admin audit scope only if the admin surface changed.
6. Refactor the admin section using shell/state/helper/dialog/table boundaries.
7. Record pass/fail results and remaining debt in the batch doc.

### Control-Center Checklist

When the batch touches overview or analytics:

1. update the active `docs/admin-aidlc/batch-*.md` record
2. strengthen `admin-control-center` markers/actions if the visible flow changed
3. rerun mocked control-center smoke
4. rerun `smoke:real:admin -- --sections control-center` or record the exact blocker

## Default Validation

```bash
npx eslint <touched admin files>
npx tsc --noEmit --pretty false
npm run aidlc:audit:admin
npm run test:client:smoke -- <admin contracts>
npm run smoke:real:admin -- --sections <sections>
git diff --check
```

## Guardrails

- Keep `/admin` URL and API shapes stable unless the batch explicitly changes them.
- Do not move admin code without moving the contract pack with it.
- If mocked smoke passes but real smoke is blocked by missing credentials or seed data, write that into the batch doc instead of silently skipping it.
- Prefer one admin batch doc per meaningful refactor wave, not one doc per file.

## References

- Architecture rules: `../../ARCHITECTURE.md`
- Contract pack template: `../aidlc-contract-pack/references/contract-pack-template.md`
- Existing admin batch docs: `../../docs/admin-aidlc/`
- Admin audit: `../../scripts/aidlcAudit.mjs`

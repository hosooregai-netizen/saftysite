# ERP Testing

## Feature Contract First

Every major ERP client feature should have a contract entry in `tests/client/featureContracts.ts`.

Minimum contract fields:

- `id`
- `routes`
- `markers`
- `apis`
- `criticalActions`

Use contracts to define what must not disappear during rapid iteration.

## Smoke Authoring Rules

- Keep smoke tests feature-scoped.
- Prefer one spec per feature.
- Reuse the ERP smoke harness and fixture state.
- Assert both UI markers and API observations.
- End every smoke with a no-page-errors / no-console-errors assertion.

## Validation Order

1. `npm run lint`
2. `npx tsc --noEmit --pretty false`
3. `npm run test:client:smoke -- <feature>`
4. `npm run aidlc:audit`
5. Run broader smoke only after targeted smoke passes

## First-Wave ERP Smokes

- `auth`
- `site-hub`
- `quarterly-report`
- `mobile-link`

These cover the highest-value user journey and should remain green before shipping ERP client changes.

## AIDLC Testing Rule

If a change touches routing, state, and API interaction together, the contract and smoke must move in the same change. Large-file edits without a targeted smoke rerun should be treated as unverified.

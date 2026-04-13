---
name: aidlc-contract-pack
description: Use for modularization, refactor, or regression-sensitive client work in saftysite-real that should leave behind a spec/record doc, feature contract updates, smoke coverage, and validation results in the same change.
---

# AIDLC Contract Pack

Use this skill for client-side refactors, file splits, large workflow edits, and any change where
we want spec, tests, and record to land together.

## Workflow

1. Read `ARCHITECTURE.md` if ownership or split boundaries are unclear.
2. Create or update one batch doc for the change.
   Admin batches go under `docs/admin-aidlc/`.
   ERP/client batches can use the closest existing batch area or add one if needed.
3. Identify the affected feature contract in `tests/client/featureContracts.ts`.
4. Add or adjust mocked smoke before or with the code change.
5. If the surface has a real smoke path, update it in the same batch.
6. Change the smallest responsible files.
7. Record actual validation results and residual debt in the same batch doc.

## Required Outputs

- one batch spec/record doc
- feature contract updates
- smoke updates
- validation record

Do not treat a refactor as complete if the code moved but the contract pack was not updated.

## Validation Order

1. targeted `eslint`
2. `npx tsc --noEmit --pretty false`
3. the relevant AIDLC audit command
4. targeted mocked smoke
5. real smoke if credentials and local app are available
6. `git diff --check`

## Guardrails

- Keep the batch doc short and operational.
- Record what actually passed, what was blocked, and why.
- Split by workflow and responsibility, not only by line count.
- If real smoke is blocked by missing credentials or seed files, record the blocker explicitly.

## References

- Architecture rules: `../../ARCHITECTURE.md`
- Contract pack template: `references/contract-pack-template.md`
- Admin batch examples: `../../docs/admin-aidlc/`
- Feature contracts: `../../tests/client/featureContracts.ts`

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
4. Identify the affected recovery slice in `tests/client/contracts/featureContractMetadata.json`.
5. Update the managed reverse spec in `docs/reverse-specs/` when the recovery slice changes.
6. If the same behavior is meant to survive as a reusable ERP capability, update the paired module
   doc/manifest in `docs/erp-reverse-platform/` and refresh provenance.
7. Add or adjust mocked smoke before or with the code change.
8. If the surface has a real smoke path, update it in the same batch.
9. Change the smallest responsible files.
10. Record actual validation results and residual debt in the same batch doc.

For admin control-center work, add one more checkpoint:

10. Update the active batch doc, the `admin-control-center` contract, the exact recovery slice, and both smoke layers as one unit.
   If real smoke is blocked, write the blocker into the same batch doc before closing the task.

## Required Outputs

- one batch spec/record doc
- feature contract updates
- recovery slice updates
- ERP reverse module updates when the behavior is reusable across industries
- smoke updates
- validation record

Do not treat a refactor as complete if the code moved but the contract pack was not updated.

## Validation Order

1. targeted `eslint`
2. `npx tsc --noEmit --pretty false`
3. the relevant AIDLC audit command
4. `npm run validate:erp-reverse-platform` when reusable ERP capabilities changed
5. targeted mocked smoke
6. real smoke if credentials and local app are available
7. `git diff --check`

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
- Recovery-slice metadata: `../../tests/client/contracts/featureContractMetadata.json`
- Reverse specs: `../../docs/reverse-specs/`
- ERP reverse platform: `../../docs/erp-reverse-platform/`

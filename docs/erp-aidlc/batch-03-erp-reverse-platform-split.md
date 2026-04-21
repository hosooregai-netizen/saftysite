# ERP AIDLC Batch 3: Reverse Platform Split

## Goal

Introduce a reusable ERP reverse platform that stays separate from the current-product
`recovery slice` reverse specs.

## Scope

- `docs/erp-reverse-platform/**`
- `scripts/erpReversePlatform.ts`
- `scripts/validateErpReversePlatform.ts`
- `scripts/generateErpReversePlatformDeck.ts`
- `scripts/verifyAidlc.mjs`
- `package.json`
- `ARCHITECTURE.md`
- `docs/reverse-specs/README.md`
- `docs/guardrails/aidlc-guardrails-overview.md`
- `skills/aidlc-contract-pack/SKILL.md`
- `skills/erp-platform-guardrails/SKILL.md`

## Contract Pack

### Feature contracts

- No new top-level smoke contracts
- Existing guardrail contracts remain unchanged

### Recovery slices used as source evidence

- `admin-overview-dashboard`
- `admin-analytics-dashboard`
- `admin-photo-admin-flow`
- `site-report-index`
- `tech-guidance-create-dialog`
- `quarterly-editor-source-sync`
- `quarterly-export-and-pdf-reuse`
- `mobile-link-session-shell`

### ERP reverse platform outputs

- module docs and manifests
- adapter spec
- industry pack spec
- composition spec
- provenance map

## Validation Commands

```bash
npx tsc --noEmit --pretty false
node scripts/validateRecoverySlices.mjs
npx tsx scripts/validateErpReversePlatform.ts
npm run generate:erp-reverse-platform-overview
git diff --check
```

## Implementation Record

### Expected outputs

- recovery-slice reverse docs remain current-product recovery artifacts
- a new reusable reverse catalog exists for capability-oriented modules
- source evidence and reusable modules are connected by provenance instead of one-to-one identity
- reverse platform gets its own validator and overview deck

### Actual results

- Added `docs/erp-reverse-platform/` with starter platform primitives, business modules, adapter,
  industry pack, composition, templates, and provenance inventory.
- Added `scripts/erpReversePlatform.ts` and `scripts/validateErpReversePlatform.ts` so the new layer
  has typed manifests plus static validation and source-change freshness checks.
- Added a generated PPT flow for the ERP reverse platform overview separate from the current
  AIDLC guardrails deck.
- Wired the new validator into the regular AIDLC verification path so guarded source changes can
  mark downstream reusable modules as review-needed.

## Validation Run

- `npx tsc --noEmit --pretty false`
  - passed
- `node scripts/validateRecoverySlices.mjs`
  - passed
- `npx tsx scripts/validateErpReversePlatform.ts`
  - passed
- `npm run generate:erp-reverse-platform-overview`
  - passed and generated `docs/erp-reverse-platform/erp-reverse-platform-overview.pptx`
- `git diff --check`
  - passed

## Residual Debt

- The starter catalog covers only the first high-value modules. More recovery slices still need
  promotion into reusable module candidates.
- `review-needed` is enforced as validation-time freshness today; a richer publish status workflow
  could be added later if the catalog grows into a larger product.

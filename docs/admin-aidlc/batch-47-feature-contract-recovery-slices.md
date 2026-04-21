# Admin AIDLC Batch 47: Feature Contract / Recovery Slice Split

## Goal

Separate top-level smoke contracts from reverse-spec recovery slices so:

- smoke and CI stay at the existing umbrella contract level
- reverse specs move at a smaller behavioral slice level
- metadata-driven validation can detect missing ownership and missing slice companions

## Scope

- `tests/client/contracts/featureContractMetadata.json`
- `tests/client/contracts/shared.ts`
- `tests/client/contracts/metadata.ts`
- `scripts/aidlcContractMetadata.mjs`
- `scripts/validateRecoverySlices.mjs`
- `scripts/verifyAidlc.mjs`
- `scripts/verifyAidlcPush.mjs`
- `docs/reverse-specs/**`
- `ARCHITECTURE.md`
- `skills/aidlc-contract-pack/SKILL.md`
- `skills/admin-contract-pack/SKILL.md`
- `skills/erp-platform-guardrails/SKILL.md`

## Contract Pack

### Top-level contracts touched

- `admin-control-center`
- `quarterly-report`
- `site-report-list`
- `mobile-link`

### Recovery slices introduced or normalized

- `admin-overview-dashboard`
- `admin-analytics-dashboard`
- `admin-photo-admin-flow`
- `quarterly-list-create`
- `quarterly-editor-source-sync`
- `quarterly-export-and-pdf-reuse`
- `site-report-index`
- `tech-guidance-create-dialog`
- `mobile-link-session-shell`
- `mobile-inspection-step7-doc7`

## Implementation Record

### Expected outputs

- top-level contract ownership and smoke metadata live in one manifest
- managed reverse specs declare explicit recovery slice ids
- push/commit verification derives smoke ownership from metadata instead of duplicated regex maps
- priority contracts can require reverse-spec companions without fragmenting the existing smoke ids

### Actual results

- added `featureContractMetadata.json` as the shared ownership manifest for guarded globs, smoke scope, and managed recovery slices
- added `validateRecoverySlices.mjs` to statically verify metadata, reverse-spec headers, inventory links, and staged slice companions
- rewired `verifyAidlc.mjs` and `verifyAidlcPush.mjs` to use metadata-driven guarded surfaces and contract ownership
- split the first migration wave into managed recovery slices for:
  - `admin-control-center`
  - `quarterly-report`
  - `site-report-list`
  - `mobile-link`
- updated reverse-spec inventory, README, template, and architecture/skill docs to distinguish:
  - batch record
  - top-level feature contract
  - recovery slice

## Validation Commands

```bash
node scripts/validateRecoverySlices.mjs
npx tsc --noEmit --pretty false
```

## Validation Run

- `node scripts/validateRecoverySlices.mjs`
  - passed
- `npx tsc --noEmit --pretty false`
  - passed
- `node scripts/validateRecoverySlices.mjs features/site-reports/quarterly-report/useQuarterlySourceSync.ts docs/reverse-specs/quarterly-editor-source-sync-reverse-spec.md`
  - passed
- metadata spot check:
  - `features/site-reports/quarterly-report/useQuarterlySourceSync.ts` resolves to top-level `quarterly-report` and recovery slice `quarterly-editor-source-sync`
  - `features/admin/sections/overview/OverviewMaterialGapSection.tsx` resolves to top-level `admin-control-center` and recovery slice `admin-overview-dashboard`

## Residual Debt

- older reverse specs still exist outside the first managed recovery-slice wave and can be migrated gradually
- staged reverse-spec enforcement is only enabled for the first managed contract set, not yet every existing contract

# ERP Reverse Platform

## Goal

This folder is the reusable ERP reverse layer.

It is intentionally separate from [docs/reverse-specs](../reverse-specs/README.md), which remain the
recovery-grade source of truth for rebuilding the current product.

If you want the easiest end-to-end explanation, start with
[reverse-and-server-introduction.md](/Users/mac_mini/Documents/GitHub/saftysite-real/docs/erp-reverse-platform/reverse-and-server-introduction.md:1).

Presentation files:

- [erp-reverse-platform-introduction.pptx](</Users/mac_mini/Documents/GitHub/saftysite-real/docs/erp-reverse-platform/erp-reverse-platform-introduction.pptx>)
- [erp-reverse-platform-full-reference.pptx](</Users/mac_mini/Documents/GitHub/saftysite-real/docs/erp-reverse-platform/erp-reverse-platform-full-reference.pptx>)

The split is:

- `docs/reverse-specs/`
  - current-product recovery layer
  - organized by `recovery slice`
  - used for guarded refactors, reverse recovery, and regression-safe rebuilds
- `docs/erp-reverse-platform/`
  - reusable ERP module layer
  - organized by capability-oriented `module`, `adapter`, `industry pack`, and `composition`
  - used for cross-industry reconstruction, module catalogs, and future no-code import/export

Do not collapse those two layers into the same unit.

## Layer Model

Use four layers in this platform:

1. `platform primitive`
   - shared capabilities such as cache, attachment lifecycle, document output, and collection shell
2. `business module`
   - reusable user-goal modules such as dashboard overview or periodic report source sync
3. `industry pack`
   - industry policy, vocabulary, compliance, and adapter requirements
4. `tenant config`
   - customer-specific bindings on top of an industry pack

Current `recovery slices` remain source evidence for these layers. They are not the same thing as
published reverse modules.

## Directory Layout

```text
docs/erp-reverse-platform/
  README.md
  module-catalog.md
  module-template.md
  adapter-template.md
  industry-pack-template.md
  composition-template.md
  modules/<module-id>/
    module.md
    module.manifest.json
  adapters/<adapter-id>/
    adapter.md
    adapter.manifest.json
  industry-packs/<pack-id>/
    pack.md
    pack.manifest.json
  compositions/<composition-id>/
    composition.md
    composition.manifest.json
  provenance/recovery-slice-map.json
```

## Operating Rules

- Every published reverse module must ship both `module.md` and `module.manifest.json`.
- Reverse module ids must be capability-oriented and use dotted namespaces.
- Reverse module ids must not be route names or screen names.
- Every module must reference at least one `sourceSlices` entry from the guarded recovery-slice layer.
- Every source slice used by a module must also appear in the provenance map.
- Every published module must declare API contracts with method, path, request shape, response shape,
  and touchpoints.
- Every published module must declare server touchpoints and per-API performance guardrails.
- Industry packs may override only the policy hooks explicitly exposed by their base modules.
- Tenant bindings may use only the surfaces exposed by enabled modules.
- If a guarded source slice changes, the connected reverse modules are review-needed until their
  docs/manifests or the provenance map are refreshed.

## Validation

Use these commands:

```bash
npm run validate:recovery-slices
npm run validate:erp-reverse-platform
```

The ERP reverse validator checks:

- module/doc manifest pairs
- source-slice provenance
- API contract completeness
- server touchpoint coverage
- per-API performance guardrail coverage
- industry-pack override boundaries
- composition tenant-binding boundaries
- review-needed module coverage when guarded source slices change

## Authoring Flow

1. Identify the affected `recovery slice` in `tests/client/contracts/featureContractMetadata.json`.
2. Confirm whether that slice is only current-product evidence or also feeds a reusable module.
3. Update the recovery spec in `docs/reverse-specs/` when the current product behavior changed.
4. Update the reverse module doc and manifest in this folder when the reusable capability changed.
5. Refresh `provenance/recovery-slice-map.json` if the evidence-to-module mapping changed.
6. Rerun the reverse validator before treating the module catalog as current.

## Current Starter Set

The initial catalog focuses on the highest-value reusable capabilities:

- `operations-dashboard.queue-overview`
- `operations-dashboard.analytics`
- `work-item.index-and-filter`
- `work-item.create-dialog`
- `periodic-report.source-sync`
- `document-output.export-and-reuse`
- `asset-review.photo-workbench`

These are backed by recovery slices that already exist in the current AIDLC guardrail system.

# Reverse Spec Kit

## Goal

This folder holds reconstruction-grade feature documentation.

The target is not:

- a product memo
- a design brief
- a code walkthrough

The target is:

- one markdown spec per recovery slice that lets us rebuild the behavior with high fidelity even if the current implementation disappears

This folder is not the reusable cross-industry ERP module catalog.

That reusable layer lives in `docs/erp-reverse-platform/` and is organized by capability modules,
adapters, industry packs, and compositions instead of recovery slices.

## Two Layers

Reverse specs now sit under a two-layer contract model:

- top-level feature contract:
  - the smoke and push-gating unit
  - examples: `admin-control-center`, `quarterly-report`, `site-report-list`
- recovery slice:
  - the reverse-spec and fine-grained recovery unit
  - examples: `admin-overview-dashboard`, `quarterly-editor-source-sync`, `tech-guidance-create-dialog`

Rules:

- keep the top-level smoke contract stable unless the user-facing workflow actually changes shape
- write one reverse spec per recovery slice
- do not use one umbrella reverse spec to describe multiple unrelated controllers just because the smoke id is shared

## When To Write One

Create or update a reverse spec when:

- a business-critical flow is being refactored
- the current implementation is large or fragile
- multiple files are tightly coupled
- the team expects rewrites or migrations later
- a guarded recovery slice changed and needs its behavioral source of truth refreshed

## What “Recoverable” Means

A reverse spec is only considered recoverable if it captures:

1. entry points and route context
2. external contracts
3. state model
4. derived state rules
5. mutation semantics
6. business rules and validation
7. error/loading/cache behavior
8. output expectations and smoke checks

If those are missing, the feature may be reimagined, but not reliably restored.

## Confidence Levels

### Level 1

UI mock only.

Contains:

- labels
- sections
- controls
- rough layout

Good for:

- design discussion
- visual rebuilding

Not enough for:

- behavioral recovery

### Level 2

Behavioral rebuild.

Adds:

- user flows
- validation
- main API inputs and outputs
- important derived state

Good for:

- feature rewrites
- simplified clones

Still risky for:

- exact regression-safe recovery

### Level 3

Production recovery.

Adds:

- full contracts
- cache semantics
- edge cases
- failure modes
- state transitions
- verification checklist

This is the default target for managed ERP/admin recovery slices.

## Authoring Workflow

1. Identify the affected top-level feature contract.
2. Identify the specific recovery slice.
3. Confirm the reverse spec path from `tests/client/contracts/featureContractMetadata.json`.
4. Extract contracts before UI commentary.
5. Document state and derived state separately.
6. Capture mutation semantics and fallback behavior explicitly.
7. Add recovery checklist items that can be tested.
8. Link the final spec from `feature-inventory.md`.
9. If the same change affects a reusable ERP capability, update the paired reverse module under
   `docs/erp-reverse-platform/` as a separate artifact.

## Granularity Rule

Good unit:

- one visible workflow with one dominant user goal
- one main controller/state owner

Examples:

- admin overview dashboard
- quarterly list/create dialog
- mobile inspection step 7 editor
- site report index

Bad unit:

- `admin`
- `reports`
- `quarterly`
- `ERP backend`

Those are too large to recover accurately from one document.

## Required Spec Header

Every managed reverse spec should declare:

- `Recovery Slice ID: \`...\``
- `Top-level contract: \`...\``
- `Reverse spec status: \`done\`` or `\`seed\``

## Recommended Spec Sections

Every reverse spec should try to include:

1. recovery slice header
2. purpose
3. source of truth
4. feature goal
5. user role
6. entry and scope
7. data contracts
8. caching and persistence
9. state model
10. business rules
11. UI composition
12. interaction flows
13. error handling
14. recovery checklist

## Naming Convention

- file name:
  - `<domain>-<slice>-reverse-spec.md`
- examples:
  - `admin-analytics-dashboard-reverse-spec.md`
  - `quarterly-editor-source-sync-reverse-spec.md`
  - `tech-guidance-create-dialog-reverse-spec.md`

## Current Files

- reusable template:
  - [reverse-spec-template.md](/Users/mac_mini/Documents/GitHub/saftysite-real/docs/reverse-specs/reverse-spec-template.md)
- managed inventory:
  - [feature-inventory.md](/Users/mac_mini/Documents/GitHub/saftysite-real/docs/reverse-specs/feature-inventory.md)

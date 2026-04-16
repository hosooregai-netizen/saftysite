# Reverse Spec Kit

## Goal

This folder is for reconstruction-grade feature documentation.

The target is not:

- a product memo
- a design brief
- a code walkthrough

The target is:

- a markdown spec that lets us rebuild a feature with high behavioral fidelity even if the original implementation is removed

## When To Write One

Create a reverse spec when:

- a feature is business-critical
- the current implementation is large or fragile
- multiple files are tightly coupled
- the team expects refactors, migrations, or rewrites
- AI-assisted recovery should be possible later without re-reading the whole codebase

## What “Recoverable” Means

A reverse spec is only considered recoverable if it captures:

1. entry points and route context
2. external contracts
3. state model
4. derived state rules
5. business rules and validation
6. user interaction flows
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

This is the default target for ERP-critical features.

## Authoring Workflow

1. Pick one feature slice, not a whole domain.
2. Identify source-of-truth files.
3. Extract contracts before UI commentary.
4. Document state and derived state separately.
5. Write business rules in plain language.
6. Add interaction flows in numbered order.
7. Add recovery checklist items that can be tested.
8. Link the final spec from `feature-inventory.md`.

## Granularity Rule

Good unit:

- one visible workflow with one dominant user goal

Examples:

- admin schedules board
- report-open legacy bootstrap
- mobile inspection step 7 editor
- site list filter + export flow

Bad unit:

- “admin”
- “reports”
- “ERP backend”

Those are too large to recover accurately from one document.

## Recommended Spec Sections

Every reverse spec should try to include:

1. purpose
2. source of truth
3. feature goal
4. user role
5. entry and scope
6. data contracts
7. caching and persistence
8. state model
9. business rules
10. UI composition
11. interaction flows
12. error handling
13. non-obvious notes
14. recovery checklist

## Naming Convention

- file name:
  - `<domain>-<feature>-reverse-spec.md`
- examples:
  - `admin-schedules-section-reverse-spec.md`
  - `worker-inspection-step7-reverse-spec.md`
  - `admin-report-open-reverse-spec.md`

## Current Files

- sample spec:
  - [admin-schedules-section-reverse-spec.md](/Users/mac_mini/Documents/GitHub/saftysite-real/docs/reverse-specs/admin-schedules-section-reverse-spec.md)
- reusable template:
  - [reverse-spec-template.md](/Users/mac_mini/Documents/GitHub/saftysite-real/docs/reverse-specs/reverse-spec-template.md)
- initial inventory:
  - [feature-inventory.md](/Users/mac_mini/Documents/GitHub/saftysite-real/docs/reverse-specs/feature-inventory.md)

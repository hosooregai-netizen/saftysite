# ERP AIDLC Batch 5: Reverse Platform Introduction Deck

## Goal

Generate a PPT deck that explains the whole reverse-platform story in one readable flow:

- why reverse is split into two layers
- how current request/server paths work
- how reusable modules are documented
- where API contracts and performance budgets live
- how the validation lifecycle keeps the structure sustainable

## Scope

- `scripts/generateErpReversePlatformIntroDeck.ts`
- `package.json`
- `docs/erp-reverse-platform/erp-reverse-platform-introduction.pptx`

## Output

- one onboarding-friendly PPT deck for the ERP reverse platform

## Validation Commands

```bash
npx tsc --noEmit --pretty false
npm run generate:erp-reverse-platform-intro-deck
git diff --check
```

## Implementation Record

### Expected outputs

- a non-technical stakeholder can follow the split between recovery slices and reusable modules
- a new engineer can quickly find current API/server entrypoints
- the deck points viewers back to the canonical docs and scripts

### Actual results

- Added a new PPT generator that summarizes guardrails, reusable reverse modules, server/API flow,
  module anatomy, representative examples, and validator lifecycle.
- Generated `docs/erp-reverse-platform/erp-reverse-platform-introduction.pptx`.
- Added an npm script so the deck can be regenerated when the docs evolve.

## Validation Run

- `npx tsc --noEmit --pretty false`
  - passed
- `npm run generate:erp-reverse-platform-intro-deck`
  - passed and generated `docs/erp-reverse-platform/erp-reverse-platform-introduction.pptx`
- `git diff --check`
  - passed

## Residual Debt

- The deck summarizes the current starter wave. If more reusable modules or performance probes are
  added later, the slide content should be refreshed to keep the overview balanced.

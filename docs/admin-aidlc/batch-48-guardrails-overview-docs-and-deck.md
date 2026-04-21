# Admin AIDLC Batch 48: Guardrails Overview Docs And Deck

## Goal

Add a human-readable guide and a regenerable PPT deck so the current AIDLC guardrail structure is easier to onboard and maintain.

## Scope

- `docs/guardrails/aidlc-guardrails-overview.md`
- `docs/guardrails/aidlc-guardrails-overview.pptx`
- `scripts/generateGuardrailsOverviewDeck.ts`
- `package.json`

## Contract Pack

### Top-level contracts touched

- none directly

### Recovery slices touched

- none directly

This batch documents the guardrail system itself rather than changing a guarded product workflow.

## Implementation Record

### Expected outputs

- one markdown guide explaining the current guardrail stack
- one PPT deck that can be regenerated from code
- one package script so teammates can rebuild the PPT after the guardrail structure changes

### Actual results

- added a detailed markdown guide at `docs/guardrails/aidlc-guardrails-overview.md`
- added a PPT generator at `scripts/generateGuardrailsOverviewDeck.ts`
- added `npm run generate:guardrails-overview`
- generated `docs/guardrails/aidlc-guardrails-overview.pptx`
- documented both current automatic guarantees and the remaining sustainability gaps

## Validation Commands

```bash
npm run generate:guardrails-overview
npx tsc --noEmit --pretty false
git diff --check
```

## Validation Run

- `npm run generate:guardrails-overview`
  - passed
  - generated `docs/guardrails/aidlc-guardrails-overview.pptx`
- `npx tsc --noEmit --pretty false`
  - passed
- `git diff --check`
  - passed

## Residual Debt

- the PPT summarizes the managed wave, but the markdown guide is still the deeper source for file-by-file explanation
- as more contracts migrate into managed recovery slices, the guide and deck should be regenerated so the counts and examples stay current

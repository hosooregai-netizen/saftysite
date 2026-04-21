# ERP AIDLC Batch 4: Reverse Platform API Contracts And Server Intro

## Goal

Make the reusable ERP reverse platform easier to understand and harder to drift by adding:

- explicit API contract sections
- request/response notes
- server touchpoints
- per-API performance guardrails
- one onboarding doc that explains reverse plus server together

## Scope

- `docs/erp-reverse-platform/README.md`
- `docs/erp-reverse-platform/module-template.md`
- `docs/erp-reverse-platform/reverse-and-server-introduction.md`
- `docs/erp-reverse-platform/modules/*`
- `scripts/erpReversePlatform.ts`
- `scripts/validateErpReversePlatform.ts`

## Reverse Platform Outputs

- richer module manifests with API and performance metadata
- richer module docs with API/server/performance sections
- onboarding guide that includes reverse and server context

## Validation Commands

```bash
npx tsc --noEmit --pretty false
npx tsx scripts/validateErpReversePlatform.ts
git diff --check
```

## Implementation Record

### Expected outputs

- published reverse modules stop being purely conceptual and become API-aware
- readers can trace each module from capability -> endpoint -> server file -> performance budget
- onboarding no longer requires bouncing between many docs just to find the current request path

### Actual results

- Added `apiContracts`, `serverTouchpoints`, and `performanceGuardrails` to published reverse module manifests.
- Updated starter module docs so each one now explains current endpoints, request/response shape, server files, and performance expectations.
- Tightened the reverse-platform validator so published modules must carry API/server/performance coverage.
- Added a new introduction doc that explains the current guardrails, reverse platform, `app/api/*`, `server/*`, and live API budget probe in one place.

## Validation Run

- `npx tsc --noEmit --pretty false`
  - passed
- `npx tsx scripts/validateErpReversePlatform.ts`
  - passed
- `git diff --check`
  - passed

## Residual Debt

- Some proxy-backed ERP modules still point to external FastAPI paths as touchpoints because the full upstream server code is outside this repo.
- Live probe budgets cover the main hot paths, but additional APIs may need formal budgets as the reverse catalog expands.

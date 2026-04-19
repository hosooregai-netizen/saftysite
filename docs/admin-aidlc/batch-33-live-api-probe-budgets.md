# Batch 33: Live API Probe Budgets

## Why
- local smoke protects UX contracts, but it does not catch live API latency or payload-size regressions
- we needed a lightweight guardrail for the real Next proxy path without forcing it on every push

## What changed
- added per-endpoint latency and response-byte budgets to `scripts/probeSafetyApiLive.ts`
- extended the live probe coverage to `assignments/me/sites`, `me/schedules`, `admin/directory/lookups`, and the summary `content-items` path
- added `npm run verify:api-live-budgets`
- updated `scripts/verifyAidlcPush.mjs` to run the live probe automatically when the required `LIVE_*` environment variables are present

## Proof
- `npx tsc --noEmit --pretty false`

# Batch 39: Admin Reports Malformed Row Guard

## What changed

- hardened `server/admin/upstreamMappers.ts` so admin reports payload mapping tolerates malformed rows
- rows without a usable `report_key` are skipped instead of crashing the entire response mapping
- missing `rows`, `limit`, `offset`, or `total` values now fall back safely

## Why

- a single malformed upstream admin report row should not take down the whole admin reports screen
- this keeps the reports route resilient while upstream data is being cleaned up

## Proof

- `server/admin/upstreamMappers.test.ts`
- `tests/client/admin/admin-reports-malformed-row-guard.md`

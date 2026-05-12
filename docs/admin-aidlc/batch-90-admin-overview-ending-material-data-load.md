# Batch 90: Admin Overview Ending And Material Data Load

- Reverted the previous table-count emphasis UI change from batch 88.
- Hardened admin overview client merging so ending-soon and quarterly material-gap tables use local computed rows when the upstream overview response has missing or partial row payloads.
- Added focused regression coverage for complete upstream rows, missing material rows, and partial ending-soon rows.


# Admin Proof: Headquarters List Order and Count

## Expected Behavior

- the headquarters list table shows a `순번` column and an `현장 수` column
- the newest created headquarters appears at the top by default
- `현장 수` renders as a number derived from the linked site rows for each headquarters

## Checks

- `npm run build`

## Notes

- this change relies on existing `created_at` data instead of a new database order column
- mocked or real smoke was not rerun in this batch

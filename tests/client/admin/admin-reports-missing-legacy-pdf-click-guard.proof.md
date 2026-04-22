# Admin Reports Missing Legacy PDF Click Guard Proof

## Scope

- clicking a legacy technical guidance row with a linked original PDF should still open the in-app original PDF viewer
- clicking a legacy technical guidance row without a linked original PDF should no longer open a failing PDF modal
- the reports section should show a notice that the original PDF is not registered yet for that row

## Validation

- `pnpm exec eslint features/admin/sections/reports/useReportsSectionState.ts tests/client/admin/admin-reports.spec.ts`
- `pnpm exec tsx tests/client/runSmoke.ts admin-reports`

## Notes

- The missing-PDF cases are real data states such as `metadata_only` legacy rows, not just a viewer bug.
- The regression was that row-click treated every `legacy:` technical guidance row as if a PDF were always available.

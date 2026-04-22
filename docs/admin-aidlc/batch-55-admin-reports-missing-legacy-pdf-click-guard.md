# Admin AIDLC Batch 55: Admin Reports Missing Legacy PDF Click Guard

## Summary

- Fixed the admin reports row-click flow for legacy technical guidance rows that do not have an uploaded original PDF.
- Preserved the existing in-app original PDF viewer for legacy rows with a verified original PDF.
- Stopped opening the original PDF modal for legacy rows whose PDF is still missing.
- Replaced the broken modal path with a list-level notice so users see that the original PDF is not registered yet instead of landing in a failing PDF dialog.

## Changed Files

- `features/admin/sections/reports/useReportsSectionState.ts`
- `tests/client/admin/admin-reports.spec.ts`
- `tests/client/admin/admin-reports-missing-legacy-pdf-click-guard.proof.md`

## Validation

- `pnpm exec eslint features/admin/sections/reports/useReportsSectionState.ts tests/client/admin/admin-reports.spec.ts`
- `pnpm exec tsx tests/client/runSmoke.ts admin-reports`

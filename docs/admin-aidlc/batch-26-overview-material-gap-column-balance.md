# Admin AIDLC Batch 26: Overview Material Gap Column Balance

## Goal

Keep the overview material-gap table readable when site and headquarter names are long by giving
the name columns more width than the short count/status columns.

## Scope

- `features/admin/sections/AdminSectionShared.module.css`
- `docs/reverse-specs/admin-overview-dashboard-reverse-spec.md`
- `tests/client/contracts/adminContracts.ts`

## Implementation Record

### Expected outputs

- `현장`, `사업장` columns stay readable without clipping first.
- `교육 부족`, `계측 부족`, `교육 현황`, `계측 현황`, `총 부족` remain visible in narrower
  columns because they only render short numeric/status strings.

### Actual results

- The overview material-gap table now allocates the widest columns to `현장` and `사업장`.
- Numeric/status columns were tightened so long names get more room before truncation.

## Validation

- `npx tsc --noEmit --pretty false`


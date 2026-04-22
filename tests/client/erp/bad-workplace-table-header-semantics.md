# ERP Proof Companion: Bad Workplace Table Header Semantics

## Covered Source Areas

- `features/site-reports/bad-workplace/BadWorkplaceViolationsSection.tsx`

## Proof Notes

- the bad workplace violations table now marks each header cell with `scope="col"`
- the action column keeps the visible `행 관리` header text while exposing proper
  table semantics to accessibility tooling and Playwright role queries
- this restores the report editor smoke path that waits for the action column header
  before adding, deleting, saving, and exporting rows

## Checks

- `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3211 npm run test:client:smoke -- bad-workplace-report`

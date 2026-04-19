# Batch 27. Analytics Table Trim And Progress Copy

## Why
- the employee analytics table was carrying low-signal columns (`전기 대비`, `실적률`) that made the grid harder to scan
- the site analytics table still used `사업장` / `실적률` copy and narrow name columns even though users read it as `건설사` / `진행률`
- older operational data often has completed visits only as past schedules, so analytics needed proof that the UI can reflect the corrected backend execution totals

## What changed
- employee detail table now keeps:
  - `지도요원명`
  - `담당 현장`
  - `계약 회차`
  - `실회차`
  - `계약 매출`
  - `매출`
  - `평균 회차 단가`
  - `지연`
- employee export matches that trimmed column set
- site detail table now uses:
  - `건설사`
  - `진행률`
- site-name and company columns are widened so long 현장명이 먼저 잘리지 않는다
- admin control-center smoke now verifies:
  - employee tab hides `전기 대비`, `실적률`
  - site tab shows `건설사`, `진행률`

## Proof
- `tests/client/admin/admin-control-center.spec.ts`
- `tests/client/contracts/adminContracts.ts`

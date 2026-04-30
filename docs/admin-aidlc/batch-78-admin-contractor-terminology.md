# Batch 78: Admin Contractor Terminology

## Scope

- Admin headquarters, sites, reports, schedules, photos, analytics, overview, and Excel import UI labels.
- Worker/mobile navigation labels and site report snapshot labels that display the headquarter/contractor entity.
- API fallback messages and export column labels surfaced by the admin frontend.

## What Changed

- Rename user-facing `사업장` labels for the headquarter entity to `건설사`.
- Rename contractor name fields from `회사명`/`사업장명` to `건설사명`, and related management/opening number labels to contractor wording.
- Keep `발주처`/`발주자 사업장관리번호` separate and leave `불량사업장 신고` as a report type name.
- Add Excel import UI labels for contractor fields while preserving legacy header aliases in import parsing.

## Proof

- `git diff --check`
- `npm run lint`
- `npx tsc --noEmit`

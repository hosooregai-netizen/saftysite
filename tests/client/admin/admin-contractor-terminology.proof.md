# Admin Contractor Terminology Proof

## Expected

- The admin headquarter entity is shown as `건설사` across list, detail, create/edit modal, filters, exports, and empty states.
- Contractor name inputs use `건설사명`.
- `발주처` and `발주자 사업장관리번호` remain separate from contractor labels.

## Validation

- `git diff --check`
- `npm run lint`
- `npx tsc --noEmit`

## Result

- All commands passed locally before commit. Lint reported only existing warnings unrelated to this terminology change.

# Batch 65: Admin Users Login ID Column Removal

## Intent

- Remove the `로그인 ID(이메일)` column from the admin users list because it is not needed in the main grid.
- Keep adjacent UX copy aligned by removing login-ID wording from the users search placeholder and fallback export.

## Admin Contract Impact

- `features/admin/sections/users/UsersTable.tsx` no longer renders the `로그인 ID(이메일)` header cell or row value cell.
- The users list search placeholder now reflects the remaining searchable fields shown in the UI copy.
- The fallback workbook export removes the email column so export headers stay aligned with the trimmed list.

## Deployment Notes

- No API, schema, or environment changes are required.
- Client deployment only.

## Verification

- `npx eslint features/admin/sections/users/UsersTable.tsx`


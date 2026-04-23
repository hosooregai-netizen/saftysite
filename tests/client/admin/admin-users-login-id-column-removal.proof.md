# Admin Users Login ID Column Removal Proof

## Scope

- the admin users list should no longer show a `로그인 ID(이메일)` column
- the users search placeholder should stop advertising login-ID search copy in the table toolbar
- fallback workbook export should match the trimmed users table columns

## Validation

- `npx eslint features/admin/sections/users/UsersTable.tsx`

## Notes

- This change only trims redundant presentation data from the list surface.
- User create/edit flows still keep email as an account field in the modal and payloads.

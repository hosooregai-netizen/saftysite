# Admin Table No-Wrap Proof

- Ran `npx eslint features/admin/sections/reports/ReportsSection.tsx features/admin/sections/reports/ReportsTable.tsx features/admin/sections/users/UsersTable.tsx`.
- Ran `npm run build`.
- Rendered `/admin?section=reports` and `/admin?section=users` against mocked admin API responses on `http://127.0.0.1:3100`.
- Confirmed search placeholders are shortened to `보고서/현장 검색` and `이름/소속 검색`.
- Confirmed report/user list rows keep compact fields on one line instead of splitting dates, status, type, and menu cells.

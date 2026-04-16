## Admin Proof Note

- Scope: `app/api/admin/reports/[reportKey]/original-pdf/route.ts`
- Intent:
  - Keep legacy original PDF opening on the admin proxy route.
  - Resolve stored content asset URLs before falling back to legacy filename guesses.
  - Preserve the in-app PDF dialog flow when upstream report metadata uses camel-case PDF fields.
- Checks:
  - `npx tsc --noEmit`


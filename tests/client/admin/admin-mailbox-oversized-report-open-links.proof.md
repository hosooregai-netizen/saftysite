# Admin Mailbox Oversized Report-Open Links Proof

## Scope

- oversized legacy report fallback mails should link to the browser-safe `report-open` page instead of the raw original-PDF API route
- raw upload asset URLs should also collapse back to `report-open` when the canonical legacy `reportKey` is known
- mailbox sends should surface a queued placeholder response for oversized link delivery

## Validation

- `pnpm exec tsx --test app/api/mail/send-report/route.test.ts`
- `pnpm exec eslint app/api/mail/send-report/route.ts app/api/mail/send-report/routeHelpers.ts app/api/mail/send-report/route.test.ts`
- `npm run build`

## Runtime Notes

- the broken browser cases from the screenshots map directly to the old fallback bodies:
  - `/api/admin/reports/.../original-pdf` required bearer auth and returned a login-expired JSON payload in a plain browser tab
  - `http://52.64.85.49/uploads/content-items/...pdf` redirected into a broken TLS path
- new oversized fallback bodies now target `/admin/report-open?reportKey=...`, which keeps login inside the app shell and reuses in-app original-PDF fetch/auth flows

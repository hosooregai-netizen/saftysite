# Mailbox Oversized Public Download Links Proof

## Scope

- oversized legacy report mails should use public signed download links instead of internal `report-open` links
- public download links should resolve through the app `/api/mail/report-download` route so external recipients do not need admin login
- the signed download token should round-trip the selected report key and remain bounded by an expiry

## Validation

- `pnpm exec tsx --test server/mail/reportDownloadLink.test.ts app/api/mail/send-report/route.test.ts`
- `pnpm exec eslint server/mail/reportDownloadLink.ts server/mail/reportDownloadLink.test.ts app/api/mail/report-download/route.ts app/api/mail/send-report/route.ts app/api/mail/send-report/routeHelpers.ts app/api/mail/send-report/route.test.ts`
- `npm run build`

## Notes

- the public download route prefers a service login when `SAFETY_ADMIN_EMAIL` and `SAFETY_ADMIN_PASSWORD` are configured, and falls back to the encrypted report-specific access token carried inside the signed link token

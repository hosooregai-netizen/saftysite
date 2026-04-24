# Mailbox Oversized Report Link Queue Proof

## Scope

- mailbox report sends should surface a queued success state when oversized legacy reports are switched to link delivery
- oversized legacy fallback bodies should point at the app `report-open` page instead of raw original-PDF API URLs

## Validation

- `pnpm exec tsx --test app/api/mail/send-report/route.test.ts`
- `pnpm exec eslint app/api/mail/send-report/route.ts app/api/mail/send-report/routeHelpers.ts app/api/mail/send-report/route.test.ts features/mailbox/components/useMailboxSendAction.ts`
- `npm run build`

## Notes

- the mailbox notice now distinguishes queued oversized link sends from normal attachment sends so users are not told that a PDF was attached when the app actually switched to browser-open delivery

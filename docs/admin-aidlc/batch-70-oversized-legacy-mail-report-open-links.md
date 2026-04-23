# Batch 70: Oversized Legacy Mail Report-Open Links

## Intent

- Stop oversized legacy report fallback emails from exposing raw `/api/admin/reports/.../original-pdf` URLs that fail in a browser.
- Stop fallback emails from exposing raw upload asset URLs that can bypass app auth or hit broken public TLS paths.
- Keep oversized report sends responsive in the mailbox by returning a queued placeholder while the link mail is dispatched in the background.

## Admin Contract Impact

- `app/api/mail/send-report/routeHelpers.ts` now rewrites oversized legacy report fallback links to `/admin/report-open?reportKey=...` on the current app origin.
- Raw original-PDF API links and raw upload asset URLs are no longer emitted into oversized fallback mail bodies when a canonical `reportKey` is available.
- `app/api/mail/send-report/route.ts` now returns a queued placeholder response for oversized link sends so the mailbox can acknowledge the request without waiting for the full upstream mail round trip.
- `features/mailbox/components/useMailboxSendAction.ts` now shows a queued notice for those oversized link sends.
- `server/admin/originalPdfDocument.ts` keeps preferring canonical content-item asset candidates for legacy upload archive paths so oversized descriptor lookup stays on the faster original-PDF route.

## Deployment Notes

- No environment-variable changes are required.
- Already-sent fallback mails keep their old links; only newly sent oversized mails will point at the `report-open` page.

## Verification

- `pnpm exec tsx --test app/api/mail/send-report/route.test.ts`
- `pnpm exec eslint app/api/mail/send-report/route.ts app/api/mail/send-report/routeHelpers.ts app/api/mail/send-report/route.test.ts`
- `npm run build`

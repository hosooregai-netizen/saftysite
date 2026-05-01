# Admin Proof: Scheduled Report Mail Flow

## Covered Behavior

- Admin safety API report rows preserve schedule/report metadata consumed by mailbox send preparation.
- Upstream admin mapper changes keep report attachment inputs stable for scheduled report mail.
- Mail report send tests cover the route-level payload and attachment behavior touched by this batch.

## Verification

- `app/api/mail/send-report/route.test.ts`
- `lib/safetyApiMappers/reportsPayload.test.ts`
- `npx tsc --noEmit --pretty false`

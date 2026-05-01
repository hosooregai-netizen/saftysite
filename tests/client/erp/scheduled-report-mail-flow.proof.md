# ERP Proof: Scheduled Report Mail Flow

## Covered Behavior

- Worker calendar next-schedule shortcuts can feed the mailbox report selection flow.
- Mailbox composition keeps selected scheduled reports, attachment templates, and send state in sync.
- Mobile worker calendar changes preserve the same schedule-to-report handoff contract.

## Verification

- `app/api/mail/send-report/route.test.ts`
- `lib/safetyApiMappers/reportsPayload.test.ts`
- `npx tsc --noEmit --pretty false`

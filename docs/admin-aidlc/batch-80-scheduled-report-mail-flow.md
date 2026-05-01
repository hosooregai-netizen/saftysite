# Batch 80: Scheduled Report Mail Flow

## Scope

- Mail report composition and send routes.
- Worker calendar next-schedule lookup and report selection state.
- Safety API admin mappers that expose schedule/report metadata used by mail flows.

## What Changed

- Added a next-schedule API route for worker schedule shortcuts.
- Reworked the worker calendar screen around the shared schedule/mail report selection flow.
- Added reusable mailbox report templates and send-state helpers for scheduled report mail.
- Kept admin safety API report metadata aligned with backend schedule/report fields.

## Verification

- `app/api/mail/send-report/route.test.ts`
- `lib/safetyApiMappers/reportsPayload.test.ts`
- `tests/client/admin/scheduled-report-mail-flow.proof.md`
- `tests/client/erp/scheduled-report-mail-flow.proof.md`

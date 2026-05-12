# Mailbox Service Improvements Proof

## Scope

- `features/mailbox/components/*`
- `apps/web/features/mailbox/components/*`
- `apps/web/app/mailbox`
- `apps/web/app/mail/connect/*`
- `apps/api/app/mail_google_service.py`
- `lib/mail/apiClient.ts`
- `types/mail.ts`

## Verification

- Final service-improvement QA script passed for the non-Toss scope.
- `/mailbox` route smoke passed.
- `/mail/connect/google?error=access_denied` route smoke passed.
- Compose validation keeps send disabled until recipient, subject, and body are present.
- Gmail send failure is treated as an error and must not create local sent success.
- Workspace Google login and Gmail connect remain separate flows.

## Open Follow-Up

- Live Google OAuth approval, backfill, reconnect, and real test-send QA remain tracked by `BLK-EXTERNAL-GMAIL-LIVE-QA`.

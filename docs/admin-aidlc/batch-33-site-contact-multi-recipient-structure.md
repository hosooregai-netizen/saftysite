# Batch 33 - Site Contact Multi Recipient Structure

## What changed

- Added frontend types and helpers for multiple site managers and client contacts.
- Reworked admin and worker site information edit screens so site managers can be added, removed, and marked as primary only from site information editing.
- Updated site detail, report dispatch, mailbox recipient selection, SMS defaults, and direct-delivery report defaults to prefer the primary site manager.

## Why

- The ordering client is distinct from the contractor, and each can have separate contacts.
- Reports and mail need a single representative recipient, while the site screen still needs to show non-primary manager contact details.

## Proof

- `npx tsc --noEmit`
- `npm run lint`
- `python -m pytest tests/test_api_hardening.py tests/auth_mail_notification/test_mail_dispatch.py`

## Notes

- `npm run lint` completed with existing warnings only.
- Schedule selection and work progress screens do not expose site manager editing.

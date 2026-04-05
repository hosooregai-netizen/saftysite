---
name: mail-notifications
description: Use for mailbox, OAuth account connection, notifications, SMS/email dispatch status, and top-right alert UX across admin and worker shells.
---

# Mail Notifications

Use this skill when the task affects mailbox, notifications, or outbound message status.

## Focus

- mailbox accounts, threads, provider status
- notification bell, important alert modal, read state
- SMS/email dispatch surfaces connected to reports

## Primary entry points

- `features/mailbox/**`
- `components/notifications/**`
- `app/api/mail/**`
- `app/api/notifications/**`
- `app/api/messages/**`
- `app/services/mail.py`, `app/services/notifications.py` in `safety-server`

## Workflow

1. Distinguish provider configuration problems from runtime send failures.
2. Keep admin-only shared mailbox behavior separate from personal linked accounts.
3. Make top-right alert UX non-blocking for task screens.
4. When adding status fields, wire them through reports and alerts consistently.

## Validation

- Provider status endpoints return a clear diagnosis.
- Notification unread counts match visible items.
- Mailbox connect actions remain clickable even when config is incomplete.
- Dispatch-related UI does not regress report workflows.

# 01 READ AND PLAN — 메일함

Implement `메일함`.

## Trace

- Route: `/mail`
- Component: `MailboxThreePaneShell`
- API: `GET /api/v1/mail/folders/{folderId}/threads`
- Models: `MailAccount, MailThread, MailMessage, MailAttachment, MailDraft`
- Prompt: `mail-draft-and-classification`
- Tests: `mailbox_tests`

## Instructions

1. Read all specs in this feature folder.
2. Keep business logic in services.
3. Keep owner-specific data isolated.
4. Add tests and update Reverse Map.
5. Do not introduce external integrations unless the feature specifically requires them.

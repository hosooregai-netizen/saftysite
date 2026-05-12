# 11_mailbox — 메일함

Priority: `P0`

## Trace

- Route: `/mail`
- Component: `MailboxThreePaneShell`
- API: `GET /api/v1/mail/folders/{folderId}/threads`
- Model: `MailAccount, MailThread, MailMessage, MailAttachment, MailDraft`
- Prompt: `mail-draft-and-classification`
- Tests: `mailbox_tests`

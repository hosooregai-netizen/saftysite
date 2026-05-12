# 08. Reverse Map — 메일함

| Feature | Route | Component | API | Model | Prompt | Test |
|---|---|---|---|---|---|---|
| 메일함 | `/mail` | `MailboxThreePaneShell` | `GET /api/v1/mail/folders/{folderId}/threads` | `MailAccount, MailThread, MailMessage, MailAttachment, MailDraft` | `mail-draft-and-classification` | `mailbox_tests` |

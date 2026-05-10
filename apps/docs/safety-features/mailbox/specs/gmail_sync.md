# Gmail Sync Spec

## 1. Goal

Gmail sync imports Gmail thread/message metadata into the local workspace mailbox so the UI can show a fast, searchable mail client and preserve report/site metadata.

## 2. Sync Modes

| Mode | Trigger | Description |
|---|---|---|
| Initial backfill | first connect or reset | fetch recent Gmail threads |
| Incremental sync | manual sync or scheduled job | fetch changed threads since last historyId |
| Send upsert | after sending | upsert sent message/thread immediately |
| Attachment fetch | on demand | fetch large attachments only when needed |

## 3. Initial Backfill

```text
_sync_google_mail_account
→ _perform_initial_gmail_backfill
→ list_gmail_thread_ids
→ for each Gmail thread id:
     fetch_gmail_thread
     _build_gmail_message_record
     _upsert_gmail_thread_bundle
→ account.metadata.initialBackfillCompleted = true
→ account.metadata.historyId = latest history id
→ account.lastSyncedAt = now
```

MVP filters:

- Backfill recent 90 days.
- Include inbox, sent, starred, trash if needed.
- Skip spam by default unless all-mail mode requires it.

## 4. Incremental Sync

```text
account.metadata.historyId exists
→ list_gmail_history_thread_ids(historyId)
→ fetch changed threads
→ upsert bundles
→ update historyId
```

If history is expired:

```text
GoogleMailHistoryExpiredError
→ set metadata.syncStatus = error or reset_required
→ optionally perform full backfill again
```

## 5. Thread Bundle Upsert

Each Gmail thread should map to:

```text
MailThread
└─ MailMessage[]
   └─ MailAttachmentRecord[]
```

Mapping requirements:

- Gmail thread id stored as providerThreadId.
- Gmail message id stored as providerMessageId.
- labels normalized into local state:
  - INBOX → inbox
  - SENT → sent
  - DRAFT → drafts if supported
  - STARRED → isStarred
  - TRASH → isTrashed
  - UNREAD absent/present → isRead
- message internalDate converted to ISO.
- participants parsed into from/to/cc.
- bodyHtml/bodyText extracted from MIME payload.
- attachments captured with filename, contentType, sizeBytes, attachmentId.

## 6. Local Search

MVP search can be local DB filtering:

- subject
- snippet
- bodyText
- from/to email
- from/to display name
- siteId
- reportKey

Future:

- dedicated full-text index
- attachment filename search
- Gmail native search query passthrough

## 7. Gmail Label Modification

UI actions map to Gmail operations:

| UI Action | Gmail Operation | Local State |
|---|---|---|
| mark read | remove UNREAD | isRead true |
| mark unread | add UNREAD | isRead false |
| star | add STARRED | isStarred true |
| unstar | remove STARRED | isStarred false |
| archive | remove INBOX | isArchived true |
| trash | trash endpoint or add TRASH | isTrashed true |
| restore | untrash endpoint | isTrashed false |

## 8. Sync Error Handling

| Error | Account Status |
|---|---|
| expired access token with valid refresh token | refresh and continue |
| invalid refresh token | reconnect_required |
| insufficient scope | reconnect_required |
| Gmail history expired | sync_error or reset_required |
| network timeout | sync_error, retry allowed |
| Google 403 rate limit | sync_error, backoff |

## 9. Frontend Sync UX

Topbar sync button:

- disabled while syncing
- spinner or loading label
- after success: show "동기화 완료"
- after failure: show account badge `재연결 필요` or `동기화 오류`

Thread list:

- keep existing rows while syncing
- show subtle progress state
- do not clear list unless query/account changed

## 10. Data Retention

For MVP:

- Store message metadata and body text/html.
- Store small attachment data only if required.
- Prefer attachment metadata + on-demand fetch for Gmail attachments.
- Deleting/disconnecting account should deactivate account and optionally hide local messages.

# Data Flow: Mailbox

## 1. Route to Component Flow

```text
apps/web/app/mailbox/page.tsx
→ MailboxShellScreen
  → MailboxTopbar
  → MailboxSidebar
  → MailboxThreadListPane
  → MailboxViewerPane
  → MailboxComposePanel
  → MailboxAppMenuDrawer
  → MailboxOnboardingState
```

OAuth callbacks:

```text
apps/web/app/mail/connect/google/page.tsx
→ MailConnectCallback(provider="google")
→ completeGoogleMailConnect
→ /mailbox redirect
```

Naver/Naver Works route exists as future provider extension:

```text
apps/web/app/mail/connect/naver/page.tsx
apps/web/app/mail/connect/naver-works/page.tsx
```

## 2. Client API Flow

Current wrapper:

```text
apps/web/lib/mailboxApi.ts
→ imports functions from @/lib/mail/apiClient
→ imports types from @/types/mail
```

The missing source files must exist for clean build:

```text
apps/web/lib/mail/apiClient.ts
apps/web/types/mail.ts
```

Expected API client responsibilities:

- Convert frontend camelCase input to backend query/body where needed.
- Normalize backend snake_case response into frontend camelCase domain types.
- Provide `rows` wrappers consistently.
- Surface API errors with useful messages.

## 3. Backend Flow

```text
main.py FastAPI routes
→ apps_stack.py mail orchestration functions
→ mail_google_service.py Gmail/Google OAuth HTTP client
→ MongoDB collections / store-backed workspace records
```

Core backend layers:

| Layer | Files | Role |
|---|---|---|
| API route | `apps/api/app/main.py` | request parsing, auth dependency, response |
| Mail app service | `apps/api/app/apps_stack.py` | account, OAuth state, thread, draft, send, sync |
| Google client | `apps/api/app/mail_google_service.py` | token exchange, refresh, Gmail API calls, token encryption |
| Domain models | `apps/api/app/models.py` / Mongo documents | in-memory or persisted records |
| Store | `apps/api/app/store.py` | workspace scoped state |

## 4. Account Connection Flow

```text
Frontend startMailConnect
→ POST /api/v1/mail/accounts/connect/google/start
→ start_mail_oauth
→ OAuth state document 저장
→ auth_url 반환

Google callback
→ MailConnectCallback
→ POST /api/v1/mail/accounts/connect/google/complete
→ complete_mail_oauth
→ exchange_google_mail_code
→ fetch_google_userinfo / fetch_gmail_profile
→ _store_mail_tokens
→ account upsert
→ sync metadata 초기화
```

## 5. Sync Flow

```text
POST /api/v1/mail/sync
→ sync_mail_accounts
→ _sync_google_mail_account
→ _ensure_google_mail_access_token
→ if initialBackfillCompleted == false:
     _perform_initial_gmail_backfill
     list_gmail_thread_ids
     fetch_gmail_thread
     _upsert_gmail_thread_bundle
  else:
     _perform_incremental_gmail_sync
     list_gmail_history_thread_ids
     fetch changed threads
     _upsert_gmail_thread_bundle
→ metadata 갱신
→ sync summary 반환
```

## 6. Send Flow

```text
MailboxComposePanel
→ sendMailboxMessage
→ POST /api/v1/mail/send
→ send_mail_message
→ _ensure_google_mail_access_token
→ Gmail messages.send
→ local sent message/thread upsert
→ response thread/message 반환
```

## 7. Draft Flow

```text
compose edit
→ createDraft / updateDraft
→ POST/PATCH /api/v1/mail/drafts
→ local draft 저장
→ activeBox=drafts에서 표시
```

## 8. UI State Flow

`MailboxShellScreen` maintains:

```text
session
accounts
providerStatuses
drafts
threads
threadDetail
selectedAccountId
selectedThreadId
selectedDraftId
activeBox
searchBox
query
composeOpen
composeMinimized
composeMaximized
compose
attachments
recipientSuggestions
appMenuOpen
sidebarOpen
expandedHistoryIds
isLoading
threadLoading
syncing
draftStatus
notice
error
reloadToken
```

Future refactor target:

```text
useMailboxSession
useMailboxAccounts
useMailboxThreads
useMailboxSelection
useMailboxCompose
useMailboxSync
```

# Code Inventory: Mailbox

## 1. Frontend Routes

```text
apps/web/app/mailbox/page.tsx
apps/web/app/mail/connect/google/page.tsx
apps/web/app/mail/connect/naver/page.tsx
apps/web/app/mail/connect/naver-works/page.tsx
```

## 2. Frontend Components

Present in latest source:

```text
apps/web/features/mailbox/components/MailboxShellScreen.tsx
apps/web/features/mailbox/components/MailboxAppMenuDrawer.tsx
apps/web/features/mailbox/components/MailboxComposePanel.tsx
apps/web/features/mailbox/components/MailboxSidebar.tsx
apps/web/features/mailbox/components/MailboxThreadListPane.tsx
apps/web/features/mailbox/components/MailboxViewerPane.tsx
apps/web/features/mailbox/components/MailboxTopbar.tsx
apps/web/features/mailbox/components/MailboxOnboardingState.tsx
apps/web/features/mailbox/components/MailboxIcon.tsx
apps/web/features/mailbox/components/MailboxShell.module.css
```

Legacy or compatibility component:

```text
apps/web/components/MailboxHubScreen.tsx
apps/web/components/MailboxHubScreen.module.css
```

## 3. Frontend API

```text
apps/web/lib/mailboxApi.ts
```

Required but missing in source if not restored:

```text
apps/web/lib/mail/apiClient.ts
apps/web/types/mail.ts
```

## 4. Required Compose/Callback Source Files

Required but missing in source if not restored:

```text
apps/web/features/mailbox/components/MailConnectCallback.tsx
apps/web/features/mailbox/components/MailboxComposeToolbar.tsx
apps/web/features/mailbox/components/MailboxRecipientField.tsx
apps/web/features/mailbox/components/mailboxComposeHelpers.ts
```

## 5. Backend

```text
apps/api/app/main.py
apps/api/app/apps_stack.py
apps/api/app/mail_google_service.py
apps/api/app/config.py
apps/api/app/models.py
apps/api/app/store.py
```

## 6. Backend Mail Functions Observed

`apps_stack.py` includes:

```text
list_mail_accounts
start_mail_oauth
complete_mail_oauth
disconnect_mail_account
list_mail_threads
get_mail_thread_detail
get_mail_message
send_mail_message
update_mail_thread_state
sync_mail_accounts
```

It also includes Gmail-specific orchestration helpers:

```text
_perform_initial_gmail_backfill
_perform_incremental_gmail_sync
_sync_google_mail_account
_ensure_google_mail_access_token
_store_mail_tokens
_read_mail_refresh_token
_read_mail_access_token
_mail_account_owner_query
_migrate_mail_account_owner_fields
```

`mail_google_service.py` includes:

```text
exchange_google_mail_code
refresh_google_mail_token
fetch_google_userinfo
fetch_gmail_profile
list_gmail_thread_ids
fetch_gmail_thread
fetch_gmail_attachment
list_gmail_history_thread_ids
modify_gmail_thread_labels
trash_gmail_thread
untrash_gmail_thread
encrypt_mail_secret
decrypt_mail_secret
```

## 7. Notes

The latest backend appears to have moved beyond a pure stub for Gmail integration. The most urgent frontend risk remains source file readiness and clean build stability.

# Validation: Mailbox

## 1. Build Validation

Required:

```bash
rm -rf apps/web/.next
cd apps/web
npm run build
```

No missing import errors for:

```text
@/types/mail
@/lib/mail/apiClient
@/features/mailbox/components/MailConnectCallback
@/features/mailbox/components/MailboxComposeToolbar
@/features/mailbox/components/MailboxRecipientField
@/features/mailbox/components/mailboxComposeHelpers
```

## 2. Smoke Routes

```text
/mailbox
/mail/connect/google?error=access_denied
/mail/connect/google?code=dummy&state=dummy
/mail/connect/naver
/mail/connect/naver-works
```

Expected:

- routes render or fail gracefully
- callback error state redirects/shows clear message
- no blank white screen

## 3. OAuth Validation

- state is generated and stored.
- state expires.
- consumed state cannot be reused.
- invalid state fails.
- redirect_uri not in allowlist fails.
- token exchange error is surfaced.
- successful complete creates/updates MailAccount.
- `userId`/`user_id` compatibility works for legacy records.
- no token value appears in frontend response or logs.

## 4. Account Validation

- no account → onboarding state.
- connected account → account row/chip visible.
- reconnect required → warning status and reconnect CTA.
- disconnect → account hidden or inactive.
- success notice and no account state cannot appear together.

## 5. Sync Validation

- initial sync imports Gmail threads.
- incremental sync updates changed threads.
- invalid refresh token marks reconnect_required.
- history expired path is handled.
- sync failure does not wipe existing local threads.
- after sync, thread list refreshes.

## 6. Thread List Validation

- inbox/sent/drafts/starred/trash/all filters work.
- search query filters results.
- selected row updates viewer.
- unread/star/attachment/time are visible.
- empty state text matches active state.

## 7. Viewer Validation

- no selected thread shows clear empty state.
- selected thread shows title, participants, body, attachments.
- attachment download works for authorized user.
- reply/forward actions open compose with correct prefill.
- trash state shows restore action.

## 8. Compose Validation

- new compose opens.
- recipient field validates email.
- suggestions work.
- attachments can be added/removed.
- draft create/update/delete works.
- send failure keeps compose open.
- send success closes compose and refreshes thread list.
- reply and forward prefill correctly.

## 9. Security Validation

- user cannot list another user's accounts.
- user cannot read another user's thread.
- user cannot send through another user's account.
- tokens are encrypted and never returned.
- attachment data is permission-protected.
- OAuth state bound to workspace/user.

## 10. Visual QA

Desktop:

- topbar + sidebar + thread list + viewer visible.
- no permanent ERP sidebar.
- list and viewer feel like a mail client.
- compose floats above content.

Mobile:

- sidebar drawer.
- thread list and viewer stack cleanly.
- compose becomes drawer/modal.

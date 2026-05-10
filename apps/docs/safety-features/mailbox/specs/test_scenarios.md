# Test Scenarios: Mailbox

## 1. Build

```bash
rm -rf apps/web/.next
cd apps/web
npm run build
```

Expected:

- no import missing
- no type missing
- no route compile failure

## 2. No Account State

1. Sign in with no connected mail account.
2. Open `/mailbox`.
3. Confirm onboarding state.
4. Confirm no success notice.
5. Click "구글 메일 연결".

Expected:

- OAuth start is called.
- user is redirected to provider auth URL or clear error appears.

## 3. OAuth Callback Error

Open:

```text
/mail/connect/google?error=access_denied
```

Expected:

- user returns to `/mailbox`.
- error notice is shown.
- account list is unchanged.

## 4. OAuth Callback Success

Mock complete endpoint success.

Expected:

- account appears in sidebar/topbar.
- account email is real provider email, not `connected.local`.
- success notice and account row appear together.
- no account empty state is not shown.

## 5. List Threads

1. Connect account.
2. Run sync.
3. Open inbox.
4. Confirm rows display.

Expected:

- row shows sender, subject, snippet, time.
- unread row is visually distinct.
- attachment icon displays if present.

## 6. Open Thread

1. Click row.
2. Confirm viewer loads thread detail.

Expected:

- title, participants, body, attachments display.
- selected row state visible.

## 7. Search

1. Type query in topbar search.
2. Confirm list updates.
3. Switch search scope.

Expected:

- search result title shown.
- empty search state if no matches.

## 8. Star / Archive / Trash / Restore

1. Star thread.
2. Move to trash.
3. Open trash.
4. Restore.

Expected:

- Gmail/local label state updated.
- UI list updates accordingly.

## 9. Compose New

1. Click `메일 작성`.
2. Add recipient, subject, body.
3. Add attachment.
4. Send.

Expected:

- validation passes.
- message sent.
- compose closes.
- sent mailbox includes sent item.

## 10. Draft

1. Open compose.
2. Enter content.
3. Save or close.
4. Open drafts.

Expected:

- draft appears.
- open draft restores content.
- delete draft removes it.

## 11. Reply

1. Open thread.
2. Click reply.
3. Confirm prefilled recipient and subject.
4. Send.

Expected:

- reply is appended to thread or sent.
- sent state refreshed.

## 12. Security

- Attempt to access another account id.
- Attempt to open thread id outside workspace.
- Attempt to send with another user's account id.

Expected:

- 403 or 404.
- no sensitive data leaked.

## 13. Visual Regression

Desktop 1440x900:

- topbar, sidebar, thread list, viewer visible.
- no permanent ERP sidebar.
- compose panel floats.

Tablet:

- sidebar collapses or drawer.
- viewer remains usable.

Mobile:

- list/detail stack or drawer.
- compose is full-screen/bottom sheet.

# Known Issues: Mailbox

## 1. Missing Source Files

Latest source imports the following but they may be missing in the uploaded source tree:

```text
apps/web/types/mail.ts
apps/web/lib/mail/apiClient.ts
apps/web/features/mailbox/components/MailConnectCallback.tsx
apps/web/features/mailbox/components/MailboxComposeToolbar.tsx
apps/web/features/mailbox/components/MailboxRecipientField.tsx
apps/web/features/mailbox/components/mailboxComposeHelpers.ts
```

Impact:

- `.next` cache may make the app seem usable.
- clean build can fail.
- deployment can fail.

Resolution:

- Run prompt `02_BUILD_READINESS.md` first.

## 2. OAuth Success + No Account UI Conflict

Observed UI risk:

```text
구글 메일 계정을 연결했습니다.
연결된 메일 계정이 없습니다.
```

This is usually caused by account persistence/query mismatch or frontend refresh timing.

Resolution:

- Ensure account is stored with both `user_id` and `userId` during legacy migration.
- Ensure list accounts query supports both.
- After complete, refetch accounts before showing final UI state.
- If refetch fails, show fetch error, not no-account state.

## 3. connected.local Placeholder Email

If connected account shows:

```text
google-user_x@connected.local
```

it indicates OAuth complete did not fetch real provider profile or the UI is using placeholder/demo account.

Resolution:

- OAuth complete must call Gmail profile/userinfo.
- MailAccount.email should be real connected email.

## 4. Backend/Frontend Naming Drift

Risk:

- backend snake_case
- frontend camelCase
- FastAPI alias mixed with JSON body fields

Resolution:

- `apps/web/lib/mail/apiClient.ts` normalizes request/response.
- `apps/web/types/mail.ts` is the single frontend type source.

## 5. Gmail Scope and Verification

Gmail read/modify scopes can require Google Cloud verification in production.

Resolution:

- Stage scope adoption.
- Document least-privilege scope.
- Handle insufficient scope as reconnect_required.

## 6. Attachment Storage

Current MVP may use base64 attachment payloads.

Risk:

- memory overhead
- large request bodies
- sensitive data exposure

Future:

- object storage upload
- attachment download endpoint
- streaming or signed URL

## 7. UI Still Too ERP-like

Current screenshots show a mail feature inside ERP navigation/card framing. The long-term target is full-screen 3-pane mailbox shell with a drawer-based 업무 메뉴, not permanent ERP sidebar.

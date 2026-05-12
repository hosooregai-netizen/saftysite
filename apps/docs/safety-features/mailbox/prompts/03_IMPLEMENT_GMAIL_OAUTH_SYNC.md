# 03_IMPLEMENT_GMAIL_OAUTH_SYNC

## Role

너는 Google OAuth, Gmail API, FastAPI, MongoDB 기반 메일 동기화 기능을 구현하는 시니어 백엔드/풀스택 엔지니어다.

## Goal

메일함의 Google Mail OAuth와 Gmail sync를 실제 동작 가능한 수준으로 구현하거나 검증/보강한다.

## Must Read

```text
docs/safety-features/mailbox/specs/oauth.md
docs/safety-features/mailbox/specs/gmail_sync.md
docs/safety-features/mailbox/specs/schema.md
docs/safety-features/mailbox/specs/api_contract.md
docs/safety-features/mailbox/specs/validation.md
docs/safety-features/mailbox/specs/known_issues.md

apps/api/app/main.py
apps/api/app/apps_stack.py
apps/api/app/mail_google_service.py
apps/api/app/config.py
apps/api/app/models.py
apps/api/app/store.py

apps/web/lib/mail/apiClient.ts
apps/web/lib/mailboxApi.ts
apps/web/features/mailbox/components/MailConnectCallback.tsx
apps/web/features/mailbox/components/MailboxShellScreen.tsx
```

## Requirements

### 1. Config

Verify or add env vars:

```text
GOOGLE_MAIL_CLIENT_ID
GOOGLE_MAIL_CLIENT_SECRET
GOOGLE_MAIL_ALLOWED_REDIRECT_URIS
MAIL_ACCOUNT_TOKEN_SECRET
APP_BASE_URL
```

### 2. OAuth Start

Ensure:

- redirect_uri allowlist validation
- state creation
- state TTL
- access_type=offline
- prompt=consent when needed
- include_granted_scopes=true
- scopes include identity + Gmail scope required for MVP

### 3. OAuth Complete

Ensure:

- state validation
- single-use state
- authorization code exchange
- userinfo/Gmail profile fetch
- real email stored
- tokens encrypted
- account upsert
- `user_id` and `userId` legacy compatibility
- token never returned to frontend

### 4. Token Refresh

Ensure:

- access token refreshed when expired
- invalid refresh token marks account reconnect_required
- token errors stored in account metadata
- logs do not expose token value

### 5. Initial Sync

Implement/verify:

- list Gmail thread IDs
- fetch Gmail thread
- parse MIME body
- parse attachments metadata
- normalize labels
- upsert local thread/message bundle
- mark initialBackfillCompleted
- store historyId

### 6. Incremental Sync

Implement/verify:

- historyId based changed thread listing
- changed thread fetch/upsert
- expired history handling
- metadata update

### 7. Send

Implement/verify:

- construct RFC 2822 MIME message
- support to/cc/bcc/subject/body/attachments
- Gmail messages.send
- upsert sent message/thread
- associate report/site metadata if provided

### 8. Frontend State

Update frontend to show:

- connected
- syncing
- sync_error
- reconnect_required
- last synced at
- real account email

Do not show success notice and no-account state together.

## Do Not

- Do not redesign mailbox layout here.
- Do not touch webhard/report/photo code.
- Do not expose tokens.
- Do not use `.next` cache as evidence of success.

## Validation

```bash
cd apps/api
# run backend tests or smoke checks if available

rm -rf apps/web/.next
cd apps/web
npm run build
```

Manual:

```text
1. Connect Google account
2. Confirm real email appears
3. Run sync
4. Confirm threads appear
5. Open thread detail
6. Send test email
7. Disconnect account
```

## Completion Criteria

- OAuth code is exchanged for tokens.
- MailAccount uses real Gmail profile email.
- Gmail sync imports at least recent threads.
- Gmail send uses Gmail API rather than local-only stub.
- reconnect_required/error states are clear.

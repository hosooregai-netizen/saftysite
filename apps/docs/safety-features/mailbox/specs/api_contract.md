# API Contract: Mailbox

## 1. Base

All mailbox API endpoints are under:

```text
/api/v1/mail
```

All private endpoints require authenticated user and workspace context.

## 2. Accounts

### GET `/api/v1/mail/accounts`

Returns connected mail accounts for current workspace/user.

Response:

```json
{
  "rows": [
    {
      "id": "mailacct_x",
      "provider": "google",
      "email": "user@example.com",
      "connectionStatus": "connected",
      "isActive": true,
      "lastSyncedAt": "2026-05-05T12:00:00Z",
      "metadata": {
        "initialBackfillCompleted": true,
        "syncStatus": "idle"
      }
    }
  ]
}
```

### DELETE `/api/v1/mail/accounts/{account_id}`

Disconnects account.

Response:

```json
{ "ok": true }
```

## 3. Provider Status

### GET `/api/v1/mail/providers/status?googleRedirectUri=...`

Response:

```json
{
  "rows": [
    {
      "provider": "google",
      "label": "구글 메일",
      "available": true,
      "configured": true
    }
  ]
}
```

## 4. OAuth Start

### POST `/api/v1/mail/accounts/connect/{provider}/start`

Request:

```json
{
  "redirect_uri": "http://localhost:3000/mail/connect/google"
}
```

Response:

```json
{
  "provider": "google",
  "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?...",
  "state": "opaque_state"
}
```

Rules:

- provider currently supports `google`.
- redirect URI must be in allowlist.
- OAuth state must expire.
- OAuth state must be single-use.

## 5. OAuth Complete

### POST `/api/v1/mail/accounts/connect/{provider}/complete`

Request:

```json
{
  "state": "opaque_state",
  "auth_code": "authorization_code",
  "redirect_uri": "http://localhost:3000/mail/connect/google"
}
```

Response:

```json
{
  "account": {
    "id": "mailacct_x",
    "provider": "google",
    "email": "user@example.com",
    "connectionStatus": "connected"
  },
  "sync": {
    "status": "scheduled"
  }
}
```

Failure:

| Status | Meaning |
|---:|---|
| 400 | missing code/state, expired state, invalid state |
| 403 | redirect URI not allowed |
| 409 | account conflict |
| 502 | Google token/profile error |

## 6. Threads

### GET `/api/v1/mail/threads`

Query:

| Name | Description |
|---|---|
| `accountId` | selected account or empty/all |
| `box` | inbox/sent/drafts/starred/trash/all |
| `query` | search query |
| `headquarterId` | optional business filter |
| `siteId` | optional site filter |
| `reportKey` | optional report filter |
| `limit` | default 100 |
| `offset` | pagination offset |

Response:

```json
{
  "rows": [],
  "total": 0,
  "limit": 100,
  "offset": 0
}
```

### GET `/api/v1/mail/threads/{thread_id}`

Response:

```json
{
  "thread": {},
  "messages": []
}
```

### PATCH `/api/v1/mail/threads/{thread_id}`

Request:

```json
{
  "is_starred": true,
  "is_archived": false,
  "is_trashed": false,
  "mark_read": true,
  "restore": false
}
```

Response:

```json
{
  "id": "thread_x",
  "isStarred": true
}
```

## 7. Message Detail

### GET `/api/v1/mail/messages/{message_id}`

Returns one message when current user can access the account/thread.

## 8. Recipient Suggestions

### GET `/api/v1/mail/recipient-suggestions?accountId=&query=&limit=8`

Response:

```json
{
  "rows": [
    {
      "email": "client@example.com",
      "name": "Client",
      "source": "recent"
    }
  ]
}
```

## 9. Drafts

### GET `/api/v1/mail/drafts?accountId=&query=`

### POST `/api/v1/mail/drafts`

### PATCH `/api/v1/mail/drafts/{draft_id}`

### DELETE `/api/v1/mail/drafts/{draft_id}`

Draft request should include:

```json
{
  "account_id": "mailacct_x",
  "subject": "제목",
  "body": "<p>본문</p>",
  "to_recipients": [{ "email": "to@example.com", "name": null }],
  "cc_recipients": [],
  "attachments": [],
  "headquarter_id": null,
  "site_id": null,
  "report_keys": []
}
```

## 10. Send

### POST `/api/v1/mail/send`

Request:

```json
{
  "account_id": "mailacct_x",
  "to_recipients": [{ "email": "to@example.com" }],
  "cc_recipients": [],
  "subject": "제목",
  "body": "<p>본문</p>",
  "attachments": [],
  "reply_to_message_id": null,
  "forwarded_from_message_id": null,
  "headquarter_id": null,
  "site_id": null,
  "report_keys": []
}
```

Response:

```json
{
  "thread": {},
  "message": {},
  "sent": true
}
```

## 11. Send Report / Prepare Report

### POST `/api/v1/mail/send-report`

Uses same send flow but can be pre-populated with report attachments or report key metadata.

### POST `/api/v1/mail/prepare-report`

Prepares report mail draft metadata.

## 12. Sync

### POST `/api/v1/mail/sync`

Response:

```json
{
  "rows": [
    {
      "accountId": "mailacct_x",
      "provider": "google",
      "status": "ok",
      "fetchedThreadCount": 10,
      "updatedThreadCount": 10
    }
  ]
}
```

## 13. Security Requirements

- All account/thread/draft queries must be scoped by workspace and user.
- User cannot access another user’s connected account.
- Token values must never be returned to frontend.
- Gmail refresh token must be encrypted at rest.
- OAuth state must be single-use and time-limited.
- API errors must not expose raw Google token response secrets.

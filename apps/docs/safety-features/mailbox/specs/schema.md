# Schema: Mailbox

## 1. Naming Rule

Frontend TypeScript domain types use camelCase.

Backend request query/body may use either camelCase aliases or snake_case depending on existing FastAPI route. API client must normalize this.

Examples:

| Frontend | Backend |
|---|---|
| `accountId` | `account_id` or `accountId` alias |
| `authCode` | `auth_code` |
| `redirectUri` | `redirect_uri` |
| `isStarred` | `is_starred` |
| `isArchived` | `is_archived` |
| `isTrashed` | `is_trashed` |
| `markRead` | `mark_read` |
| `ccRecipients` | `cc_recipients` |
| `reportKeys` | `report_keys` |

## 2. MailProvider

```ts
export type MailProvider = 'google' | 'naver_mail' | 'naver_works';
```

## 3. MailboxBox

```ts
export type MailboxBox =
  | 'all'
  | 'inbox'
  | 'sent'
  | 'drafts'
  | 'starred'
  | 'trash';
```

## 4. MailAccount

```ts
export interface MailAccount {
  id: string;
  workspaceId: string;
  userId: string;
  provider: MailProvider;
  email: string;
  displayName: string | null;
  mailboxLabel: string;
  connectionStatus:
    | 'connected'
    | 'reconnect_required'
    | 'syncing'
    | 'sync_error'
    | 'disabled';
  isActive: boolean;
  isDefault: boolean;
  lastSyncedAt: string | null;
  createdAt: string;
  updatedAt: string;
  metadata?: {
    initialBackfillCompleted?: boolean;
    syncStatus?: 'idle' | 'syncing' | 'error' | string;
    syncError?: string | null;
    historyId?: string | null;
    scope?: string;
    tokenExpiresAt?: string | null;
    providerAccountId?: string | null;
    [key: string]: unknown;
  };
}
```

Legacy compatibility:

- `userId` and `user_id` must both be supported while legacy records exist.
- Response should prefer frontend `userId`.
- Storage can keep both fields until migration is complete.

## 5. MailRecipient

```ts
export interface MailRecipient {
  email: string;
  name?: string | null;
}
```

## 6. MailAttachmentRecord

```ts
export interface MailAttachmentRecord {
  id?: string;
  filename: string;
  contentType: string;
  sizeBytes: number;
  dataBase64?: string;
  downloadUrl?: string;
  source?: string | null;
  gmailAttachmentId?: string | null;
  messageId?: string | null;
}
```

Security note:

- Do not return raw attachment data unless the user is authorized and the client explicitly needs it.
- Prefer signed/download endpoint for larger files in future.

## 7. MailMessage

```ts
export interface MailMessage {
  id: string;
  workspaceId: string;
  accountId: string;
  threadId: string;
  providerMessageId?: string | null;
  direction: 'inbound' | 'outbound' | 'draft';
  subject: string;
  bodyHtml: string;
  bodyText: string;
  snippet: string;
  from: MailRecipient;
  toRecipients: MailRecipient[];
  ccRecipients: MailRecipient[];
  bccRecipients?: MailRecipient[];
  attachments: MailAttachmentRecord[];
  sentAt: string | null;
  receivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  isRead: boolean;
  isStarred: boolean;
  labels: string[];
  siteId?: string | null;
  headquarterId?: string | null;
  reportKey?: string | null;
}
```

## 8. MailThread

```ts
export interface MailThread {
  id: string;
  workspaceId: string;
  accountId: string;
  providerThreadId?: string | null;
  subject: string;
  snippet: string;
  participants: MailRecipient[];
  lastMessageAt: string | null;
  messageCount: number;
  attachmentCount: number;
  isRead: boolean;
  isStarred: boolean;
  isArchived: boolean;
  isTrashed: boolean;
  labels: string[];
  box: MailboxBox;
  siteId?: string | null;
  headquarterId?: string | null;
  reportKey?: string | null;
  createdAt: string;
  updatedAt: string;
}
```

## 9. MailThreadDetail

```ts
export interface MailThreadDetail {
  thread: MailThread;
  messages: MailMessage[];
}
```

## 10. MailboxDraft

```ts
export interface MailboxDraft {
  id: string;
  workspaceId: string;
  accountId: string;
  subject: string;
  body: string;
  toRecipients: MailRecipient[];
  ccRecipients: MailRecipient[];
  attachments: MailAttachmentRecord[];
  headquarterId?: string | null;
  siteId?: string | null;
  reportKeys?: string[];
  createdAt: string;
  updatedAt: string;
}
```

## 11. MailProviderStatus

```ts
export interface MailProviderStatus {
  provider: MailProvider;
  label: string;
  available: boolean;
  configured: boolean;
  reason?: string | null;
  authUrl?: string | null;
}
```

## 12. MailSyncSummary

```ts
export interface MailSyncSummary {
  accountId: string;
  provider: MailProvider;
  status: 'ok' | 'skipped' | 'error' | 'reconnect_required';
  fetchedThreadCount: number;
  updatedThreadCount: number;
  error?: string | null;
}
```

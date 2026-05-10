# 02_BUILD_READINESS: Mailbox Source Recovery

## Role

너는 Next.js TypeScript 프로젝트의 clean build를 안정화하는 시니어 프론트엔드 엔지니어다.

## Goal

메일함 기능의 누락 source file/import/type 문제를 해결하여 `.next` 캐시에 의존하지 않고 clean build가 가능하게 만든다. UI 고도화나 Gmail 기능 구현은 이번 작업의 목표가 아니다.

## Context

최신 source에서 다음 imports가 존재한다.

```text
@/types/mail
@/lib/mail/apiClient
@/features/mailbox/components/MailConnectCallback
@/features/mailbox/components/MailboxComposeToolbar
@/features/mailbox/components/MailboxRecipientField
@/features/mailbox/components/mailboxComposeHelpers
```

이 파일들이 없으면 clean build가 실패한다.

## Must Read

```text
docs/safety-features/mailbox/specs/schema.md
docs/safety-features/mailbox/specs/api_contract.md
docs/safety-features/mailbox/specs/compose.md
docs/safety-features/mailbox/specs/code_inventory.md
docs/safety-features/mailbox/specs/known_issues.md

apps/web/features/mailbox/components/MailboxShellScreen.tsx
apps/web/features/mailbox/components/MailboxComposePanel.tsx
apps/web/features/mailbox/components/MailboxViewerPane.tsx
apps/web/lib/mailboxApi.ts
apps/web/app/mail/connect/google/page.tsx
```

## Required Files to Create or Restore

```text
apps/web/types/mail.ts
apps/web/lib/mail/apiClient.ts
apps/web/features/mailbox/components/MailConnectCallback.tsx
apps/web/features/mailbox/components/MailboxComposeToolbar.tsx
apps/web/features/mailbox/components/MailboxRecipientField.tsx
apps/web/features/mailbox/components/mailboxComposeHelpers.ts
```

## Requirements

### 1. `apps/web/types/mail.ts`

Export all types required by mailbox components and API wrapper:

```text
MailboxBox
MailProvider
MailDirection
MailRecipient
MailAttachmentRecord
MailAttachmentPayload
MailAccount
MailProviderStatus
MailThread
MailMessage
MailThreadDetail
MailboxDraft
MailRecipientSuggestion
MailSyncSummary
```

### 2. `apps/web/lib/mail/apiClient.ts`

Implement low-level API functions used by `apps/web/lib/mailboxApi.ts`.

Must include:

```text
fetchMailAccounts
fetchMailProviderStatuses
startGoogleMailConnect
completeGoogleMailConnect
disconnectMailAccount
fetchMailThreads
fetchMailThreadDetail
patchMailThread
fetchMailRecipientSuggestions
fetchMailboxDrafts
createMailboxDraft
updateMailboxDraft
deleteMailboxDraft
sendMail
syncMail
```

Responsibilities:

- use existing auth/session fetch pattern in project
- convert request body/query as needed
- normalize response to frontend types
- throw useful errors

### 3. `MailConnectCallback.tsx`

Handle:

- `code`
- `state`
- `error`
- `provider`
- pending connect state from session storage if used
- redirect back to `/mailbox` with success/error notices

### 4. `mailboxComposeHelpers.ts`

Implement:

```text
dedupeRecipients
isLikelyEmail
stripHtmlToText
formatMailBodyHtml
buildReplySubject
buildForwardSubject
buildThreadRecipients
buildForwardBody
```

### 5. `MailboxRecipientField.tsx`

Implement recipient chips, suggestions, keyboard navigation, invalid email state.

### 6. `MailboxComposeToolbar.tsx`

Implement basic rich-text toolbar buttons used by `MailboxComposePanel`.

## Do Not

- Do not change Gmail OAuth backend in this step.
- Do not redesign mailbox UI in this step.
- Do not touch webhard/report/photo-album code.
- Do not edit `.next` or `.venv`.

## Validation

```bash
rm -rf apps/web/.next
cd apps/web
npm run build
```

Also open or smoke test:

```text
/mailbox
/mail/connect/google?error=access_denied
/mail/connect/google?code=dummy&state=dummy
```

## Completion Criteria

- No missing import error.
- No missing TypeScript type error from mailbox files.
- `/mailbox` route compiles.
- OAuth callback route compiles.
- Existing UI behavior remains unchanged except errors are clearer.

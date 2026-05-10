# 05_IMPLEMENT_COMPOSE_PANEL

## Role

너는 Gmail-like compose UX를 구현하는 시니어 프론트엔드 엔지니어다.

## Goal

새 메일, 답장, 전달, 임시저장, 첨부파일, 수신자 자동완성을 floating compose panel에서 안정적으로 처리한다.

## Must Read

```text
docs/safety-features/mailbox/specs/compose.md
docs/safety-features/mailbox/specs/schema.md
docs/safety-features/mailbox/specs/api_contract.md
docs/safety-features/mailbox/specs/validation.md

apps/web/features/mailbox/components/MailboxComposePanel.tsx
apps/web/features/mailbox/components/MailboxComposeToolbar.tsx
apps/web/features/mailbox/components/MailboxRecipientField.tsx
apps/web/features/mailbox/components/mailboxComposeHelpers.ts
apps/web/features/mailbox/components/MailboxShellScreen.tsx
apps/web/lib/mailboxApi.ts
```

## Requirements

### 1. Panel States

Support:

```text
open
closed
minimized
maximized
sending
saved
error
```

### 2. New Mail

- empty compose
- selected account is applied
- validation for recipient
- validation/confirmation for empty subject if needed

### 3. Reply

- subject prefix `Re:`
- toRecipients from original sender/thread
- quote original body

### 4. Forward

- subject prefix `Fwd:`
- forwarded content block
- optional attachment handling

### 5. Recipient Field

- suggestions
- keyboard nav
- tokenized recipients
- invalid email warning
- dedupe

### 6. Attachments

- add files
- show filename/size
- remove
- convert to API payload
- enforce max size if configured

### 7. Drafts

- create/update/delete draft
- restore draft on click
- status label:
  - 저장 중
  - 임시저장됨
  - 저장 실패

### 8. Send

- call `sendMailboxMessage`
- show loading
- on success close panel, refresh list
- on failure keep content and show error

## Do Not

- Do not change Gmail backend in this step unless required by compose contract.
- Do not modify unrelated app features.

## Validation

- new mail opens/sends
- reply opens with correct fields
- forward opens with correct fields
- draft saves and reopens
- attachments add/remove
- clean build passes

# Mailbox Connect Table Layout Proof

## Coverage

- The mailbox connect account table no longer inherits the shared admin table minimum width that created horizontal scrolling in the login/connect gate.
- The secondary "connected account providers" intro header was removed so the connect table starts directly under the mail account login panel.
- Provider, status, guidance, and action columns now fit inside the mailbox panel with fixed table layout and wrapping action buttons.

## Verification

- `npx eslint features/mailbox/components/MailboxConnectWorkspace.tsx`

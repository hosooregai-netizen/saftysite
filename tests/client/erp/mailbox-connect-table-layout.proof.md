# Mailbox Connect Table Layout Proof

## Coverage

- The mailbox connect account table no longer inherits the shared admin table minimum width that created horizontal scrolling in the login/connect gate.
- The secondary "connected account providers" intro header was removed so the connect table starts directly under the mail account login panel.
- Provider, status, guidance, and action columns now render as bounded grid rows instead of native table columns, keeping the action buttons inside the compact list width.
- The connect prompt and account table remove the intermediate vertical gap so the provider list starts immediately below the prompt without clipped action buttons.
- The provider list fills the mailbox panel width while keeping the action buttons inside bounded grid columns.

## Verification

- `npx eslint features/mailbox/components/MailboxConnectWorkspace.tsx`

# Mailbox Initial Loading State Proof

## Scenario

- Mailbox loads on a hard refresh before account and provider state has been fetched.
- The workspace should not briefly render the connect gate or an empty mailbox state while the initial account query is still pending.
- Thread list/detail fetches should wait until the mailbox account state is ready and a selectable account is resolved.

## Expected Result

- On first refresh, the mailbox keeps a neutral loading shell until account state is ready.
- The connect gate only appears after the initial account fetch finishes and confirms there are no connected accounts.
- The thread list does not issue a real mailbox fetch with an empty account id during the initial loading window.
- The thread detail view does not clear into a mismatched intermediate state while account state is still resolving.

## Commands Run

- `npx eslint features/mailbox/components/useMailboxAccountState.ts features/mailbox/components/MailboxPanel.tsx features/mailbox/components/useMailboxThreadState.ts features/mailbox/components/mailboxWorkspaceContentTypes.ts features/mailbox/components/useMailboxPanelLayoutProps.ts features/mailbox/components/MailboxWorkspaceContent.tsx`

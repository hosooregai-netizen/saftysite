# Mailbox Workspace UI Cleanup Proof

## Scenario

- Worker/admin mailbox now uses the mail list screen as the visual baseline for list, detail, compose, and connect states.
- The detail reader should stay compact without duplicate helper chips, duplicate action bars, or nested section chrome.
- The thread list should avoid duplicate pagination controls and horizontal scrolling for the default mailbox table width.

## Expected Result

- Mailbox detail renders as one compact header block with `목록`, subject, sender/time, and inline reply/forward/delete actions.
- The mailbox shell header stays full in list view but collapses to a shorter toolbar in detail/compose views.
- Mail body HTML renders in an isolated frame that preserves email styles while expanding to show more content.
- The thread list keeps only one pagination control and no longer shows the redundant bottom pager.
- The thread list table drops the placeholder attachment column and fits within the workspace without a horizontal slider.
- Mailbox connect and compose surfaces share the same flatter table-shell language as the list view.

## Commands Run

- `npx eslint features/mailbox/components/MailboxThreadDetailSection.tsx features/mailbox/components/mailboxComposeHelpers.ts`
- `npx eslint features/mailbox/components/MailboxHeaderPanel.tsx features/mailbox/components/MailboxThreadWorkspace.tsx features/mailbox/components/MailboxThreadDetailSection.tsx`
- `npx eslint features/mailbox/components/MailboxThreadListSection.tsx`

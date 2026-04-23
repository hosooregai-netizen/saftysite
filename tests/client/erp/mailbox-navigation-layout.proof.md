# Mailbox Navigation Layout Proof

## Scenario

- Worker/admin mailbox routes already expose `받은편지함` and `보낸편지함` from the side navigation.
- The mailbox header should not repeat `전체 메일함`, `받은편지함`, `보낸편지함` buttons in the main content area.
- Entering `/mailbox` or legacy `box=all` links should land on `받은편지함` so the side menu state stays consistent.

## Expected Result

- The mailbox header keeps search, refresh, compose, and logout actions, but no longer renders a duplicate tab rail.
- The main thread list heading uses a neutral `메일 목록` label instead of repeating the current mailbox name.
- Side navigation links for mailbox open `box=inbox` and `box=sent` as the only visible list scopes.
- Missing `box`, `box=all`, or `box=accounts` query values are normalized to `box=inbox`.
- Admin mailbox top-level navigation also opens the inbox route by default.

## Commands Run

- `npx eslint components/admin/AdminMenu.tsx features/mailbox/components/MailboxHeaderPanel.tsx features/mailbox/components/MailboxThreadWorkspace.tsx features/mailbox/components/useMailboxPanelLayoutProps.ts features/mailbox/components/mailboxViewHelpers.ts features/mailbox/components/useMailboxRoutingState.ts`
- `npx tsc --noEmit --pretty false`


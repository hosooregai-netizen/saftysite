# Admin Mail Recipient Suggestions Proxy Proof

## Scope
- Mailbox compose recipient autocomplete should resolve through the app's same-origin Next API surface.
- The upstream safety API already has `/mail/recipient-suggestions`; the app was missing `/api/mail/recipient-suggestions`.

## Proof
- Added a dedicated route that forwards `accountId`, `query`, and bounded `limit` to `/mail/recipient-suggestions`.
- Added the backend response type used by the server proxy helper.
- TypeScript passed with `npx tsc --noEmit`.

## Residual Risk
- Existing mocked smoke does not currently open mailbox compose and type into the recipient field, so this proof records the targeted route-level fix.


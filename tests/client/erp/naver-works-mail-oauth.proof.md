# NAVER WORKS Mail OAuth ERP Proof

## Covered Flow

- Worker/mailbox surfaces now model `naver_works` as a distinct OAuth provider state.
- The mailbox callback helper supports `/mail/connect/naver-works` without changing Google or personal NAVER callback behavior.
- The connect workspace shows a dedicated NAVER WORKS login action so WORKS accounts are not sent to personal NAVER OAuth.
- The personal NAVER IMAP/SMTP credential form is no longer exposed from the mailbox connect workspace.

## Expected ERP Behavior

- Clicking NAVER WORKS login sets the pending provider to `naver_works` and disables only that button while the OAuth start request is running.
- Returning from WORKS OAuth completes through the WORKS-specific API route and reuses the existing mailbox account refresh path.
- If WORKS provider settings are incomplete, the provider status detail remains visible before the user attempts a connection.
- Users no longer see a NAVER Mail SMTP/app-password login path in the main mailbox connection UI.

## Verification

- `npx tsc --noEmit --pretty false`
- Targeted ESLint passed for the changed mailbox components and mail API client.

# NAVER Mail IMAP/SMTP Proof

## Scope
- `features/mailbox/**`

## Intent
- Personal NAVER Mail uses an IMAP/SMTP credential form instead of the OAuth login button.
- The form collects mail address, display name, and application password, then calls `POST /mail/accounts/connect/naver`.
- OAuth-based NAVER and NAVER WORKS paths remain separate.

## Manual Checks
- Open the mailbox connect gate and verify the NAVER card shows IMAP/SMTP guidance and credential fields.
- Submit invalid credentials and verify the backend message tells the user to enable IMAP/SMTP and check the application password.
- Submit valid credentials and verify the connected account appears in the mailbox selector.

# Batch 59: NAVER WORKS Mail OAuth

## Intent

- Add NAVER WORKS as a separate mailbox connection target instead of routing WORKS users through personal NAVER OAuth.
- Keep personal NAVER Mail and Google connection flows intact while adding a dedicated WORKS start/complete proxy path.
- Surface provider configuration status so admins can see when the WORKS OAuth client, secret, or redirect URI is not ready.

## Admin Contract Impact

- `server/admin/safetyApiServer.ts` now proxies NAVER WORKS OAuth start and completion requests.
- `/api/mail/providers/status` forwards the WORKS redirect URI used by the current client origin.
- The callback route is `/mail/connect/naver-works`, matching the provider-specific connect button and server redirect validation.

## Deployment Notes

- The safety API needs `NAVER_WORKS_OAUTH_CLIENT_ID`, `NAVER_WORKS_OAUTH_CLIENT_SECRET`, and a matching `NAVER_WORKS_OAUTH_REDIRECT_URI`.
- NAVER WORKS Developer Console must allow the same callback URI and enable the mail/OIDC scopes used by the server.
- This change enables WORKS account connection and send transport; it does not convert personal NAVER login into a WORKS login.

## Verification

- `npx tsc --noEmit --pretty false`
- `npx eslint --ignore-pattern 'reverse-rebuild/**' app/api/mail/providers/status/route.ts app/api/mail/accounts/connect/naver-works/start/route.ts app/api/mail/accounts/connect/naver-works/complete/route.ts app/mail/connect/naver-works/page.tsx features/mailbox/components/MailConnectCallback.tsx features/mailbox/components/MailboxConnectWorkspace.tsx features/mailbox/components/MailboxWorkspaceContent.tsx features/mailbox/components/mailConnectCallbackHelpers.ts features/mailbox/components/mailboxWorkspaceContentTypes.ts features/mailbox/components/useMailConnectCallback.ts features/mailbox/components/useMailboxAccountActions.ts features/mailbox/components/useMailboxAccountState.ts features/mailbox/components/useMailboxPanelLayoutProps.ts features/mailbox/components/useMailboxPanelUiState.ts lib/mail/apiClient.ts server/admin/safetyApiServer.ts`
- `git diff --check`

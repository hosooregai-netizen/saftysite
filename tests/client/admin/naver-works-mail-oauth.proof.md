# NAVER WORKS Mail OAuth Admin Proof

## Covered Flow

- Provider status requests include a `naverWorksRedirectUri` query parameter so the server can validate the active callback origin.
- The Next API surface now exposes WORKS-specific start and complete routes under `/api/mail/accounts/connect/naver-works`.
- Admin server proxy helpers keep the WORKS flow separate from the existing Google and personal NAVER providers.

## Expected Admin Behavior

- If the WORKS OAuth env values are missing, the mailbox connection UI can show an actionable provider status instead of opening a broken login.
- If the env values are present, the WORKS button starts the WORKS OAuth flow and returns to `/mail/connect/naver-works`.
- Existing Google and personal NAVER connection buttons remain available.

## Verification

- TypeScript and targeted ESLint passed for the changed mail and admin API files.
- Server-side WORKS mail OAuth files passed Python compile checks in the safety API repository.

# Test Scenarios: Account Settings

## Smoke

- [ ] `/account`
- [ ] `/auth/google/callback?error=access_denied`
- [ ] `/auth/google/callback?code=dummy&state=dummy`

## Auth

- [ ] Google auth start success
- [ ] redirectUri mismatch error
- [ ] callback missing code
- [ ] callback missing state
- [ ] callback provider error
- [ ] state expired
- [ ] state replay attempt
- [ ] success redirect nextPath

## Session

- [ ] local session
- [ ] anonymous session
- [ ] authenticated session
- [ ] cached session invalidation

## Guest import

- [ ] directory import
- [ ] photoAlbum import
- [ ] drive items import
- [ ] drive shares import
- [ ] mailbox drafts import
- [ ] duplicate import skip
- [ ] invalid reference handling

## Billing entry

- [ ] free package display
- [ ] starter package checkout intent
- [ ] team package checkout intent
- [ ] agency package checkout intent
- [ ] auth required before checkout
- [ ] billingNotice 표시
- [ ] billingError 표시

## Security

- [ ] external nextPath 차단
- [ ] token/code 로그 노출 없음
- [ ] workspace 밖 import 불가

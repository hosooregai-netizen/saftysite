# Release Gate

## Release 전 필수 조건

### Build

- [ ] frontend clean build 성공
- [ ] backend compile/import check 성공
- [ ] source readiness watchlist 확인

### Route smoke

- [ ] P0 route smoke 통과
- [ ] OAuth callback error state 확인
- [ ] invalid share token 확인

### Security

- [ ] workspace access negative test 통과
- [ ] public share boundary 통과
- [ ] OAuth state regression 통과
- [ ] billing webhook idempotency 통과

### Business flow

- [ ] report create → AI draft → review → export
- [ ] report export → credit ledger
- [ ] webhard share → public viewer
- [ ] mailbox connect/onboarding state
- [ ] guest import flow

## Release 금지 조건

- clean build 실패
- security/billing/auth 실패
- report export gate 실패

# Release Decision Gate

## Release 가능

- clean build 통과
- S0/S1 blocker 없음
- security/billing/auth/report export gate 통과
- core route smoke 통과
- docs coverage critical gap 없음

## Release hold

- build 실패
- S0/S1 blocker 존재
- mailbox state contradiction
- webhard visual regression
- report export billing failure
- OAuth/session gate failure

## Conditional release

- S2 중 workaround 명확
- S3/S4 only
- owner와 fix target date 존재

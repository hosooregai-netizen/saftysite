# Security Regression

## Workspace access

모든 workspace data API는 현재 사용자 membership을 검증해야 한다.

대상:

```text
reports
drive/webhard
mailbox
photo-album
headquarters-sites
billing ledger
```

## Public share security

- token active 확인
- expired/revoked share 차단
- shared root 밖 item 접근 차단
- trashed/deleted item 접근 차단
- 권한 없는 사용자에게 `data_url`, `external_url`, `text_content` 반환 금지

## OAuth security

- OAuth state 1회성 소비
- redirect URI allowlist 검증
- Workspace Google login과 Gmail connect 분리
- refresh token 암호화 저장
- token 로그 출력 금지

## Billing security

- Toss webhook idempotency
- credit ledger workspace_id 기준
- report export 최초 차감 정책 검증

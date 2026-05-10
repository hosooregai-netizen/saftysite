# RC Security Gates

## Workspace access

다른 workspace의 resource에 접근할 수 없어야 한다.

```text
ReportRecord
DriveItem
DriveShare
MailAccount
PhotoAlbumItem
SafetyHeadquarter
SafetySite
CreditLedgerEntry
```

## Webhard public share

- expired token 차단
- revoked token 차단
- shared root 밖 parent_id 차단
- shared root 밖 item_id 차단
- viewer role edit/delete/share UI 차단
- 권한 없는 사용자에게 `dataUrl`, `textContent`, `externalUrl` 반환 금지

## OAuth/session

- `/auth/google/callback`과 `/mail/connect/google` 분리
- OAuth state 1회성 소비
- redirect URI allowlist
- Gmail refresh token 평문 노출 금지

## Billing/report export

- confirm/webhook 중복 지급 금지
- review incomplete export 차단
- local/generated snapshot export 차단
- first final export 1 credit 차감
- same report second export no charge

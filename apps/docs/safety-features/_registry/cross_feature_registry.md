# Cross Feature Registry

## 기능 의존성

| Source Feature | Depends On | Reason |
|---|---|---|
| report-workspace | headquarters-sites | 보고서 seed: 사업장/현장 |
| report-workspace | photo-album | 사진 증거 재사용/연결 |
| report-workspace | billing-credits | PDF/HWPX 출력 과금 |
| report-workspace | mailbox | 보고서 메일 발송 |
| report-list | report-workspace | 보고서 상태/출력 이력 |
| report-list | headquarters-sites | site/headquarter 표시/필터 |
| photo-album | headquarters-sites | 사업장/현장 필터 |
| photo-album | auth-workspace | guest import/auth workspace |
| webhard | auth-workspace | workspace 권한 |
| webhard | account-settings | guest drive import |
| mailbox | auth-workspace | 앱 로그인과 mailbox auth 구분 |
| mailbox | report-list | report attachment 후보 |
| mailbox | headquarters-sites | site/report context badge |
| account-settings | auth-workspace | session/profile/workspace |
| account-settings | billing-credits | billing entry |
| billing-credits | auth-workspace | workspace 단위 ledger |
| billing-credits | report-workspace | report export billing |

## 변경 영향 규칙

- `SafetySite` schema 변경 → report-workspace, report-list, photo-album, mailbox 문서 확인
- `ReportRecord` schema 변경 → report-workspace, report-list, billing-credits, mailbox 문서 확인
- `Workspace` 또는 `Membership` 변경 → 모든 기능의 workspace access 확인
- `CreditLedgerEntry` 변경 → billing-credits, report-workspace export 문서 확인
- Gmail OAuth 변경 → mailbox 문서와 auth-workspace의 Google auth 분리 문서 확인

# RC Route Smoke Matrix

| Route | Feature | 기대 결과 |
|---|---|---|
| `/` | app entry | 메뉴/대시보드 진입 |
| `/dashboard` | dashboard | 대시보드 또는 진입 화면 |
| `/pricing` | pricing/billing | 요금/패키지 안내 |
| `/reports/new` | report-workspace | 새 보고서 작성 flow |
| `/reports` | report-list | 작성/출력 이력 |
| `/reports/{knownId}` | report-workspace | 보고서 검토 화면 |
| `/headquarters` | headquarters-sites | 사업장 관리 |
| `/sites` | headquarters-sites | 현장 목록 |
| `/photo-album` | photo-album | 사진첩 grid/list |
| `/webhard` | webhard | Drive-like workspace |
| `/share/{validToken}` | webhard | public viewer |
| `/share/{invalidToken}` | webhard | invalid/expired 안내 |
| `/mailbox` | mailbox | 3-pane mailbox 또는 onboarding |
| `/mail/connect/google?error=access_denied` | mailbox | OAuth error 안내 |
| `/account` | account-settings | 계정/기본정보 |
| `/auth/google/callback?error=access_denied` | auth-workspace | Workspace auth error |
| `/billing/checkout` | billing-credits | checkout state |
| `/billing/success` | billing-credits | success/confirm state |
| `/billing/fail` | billing-credits | fail state |
| `/credits` | billing-credits | credit ledger/balance |

## Non-regression

- 웹하드: ERP 카드형 회귀 금지
- 메일함: 연결 성공 + 계정 없음 동시 표시 금지
- 보고서: 검토 전 export 활성화 금지

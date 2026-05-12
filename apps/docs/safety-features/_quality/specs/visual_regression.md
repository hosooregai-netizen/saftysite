# Visual Regression

## 기준

| Feature | Visual 기준 |
|---|---|
| webhard | Drive-like fullscreen workspace |
| mailbox | Three-pane mailbox |
| report-workspace | guided upload + review workspace |
| report-list | ERP list management |
| headquarters-sites | ERP directory table/form |
| photo-album | photo grid/list |
| account-settings | settings sections |
| billing-credits | checkout/success/fail |
| auth-workspace | callback/loading/error states |

## Webhard non-regression

- ERP 카드형 웹하드로 회귀 금지
- `탐색 카드 + 폴더 카드 + 자료 목록 카드 + 항상 열린 상세 카드` 구조 금지
- 좌측 Drive nav + 중앙 file canvas + optional detail panel 유지

## Mailbox non-regression

- 연결 성공 메시지와 계정 없음 메시지 동시 표시 금지
- three-pane 구조 유지
- 계정 없음 state도 onboarding으로 표시

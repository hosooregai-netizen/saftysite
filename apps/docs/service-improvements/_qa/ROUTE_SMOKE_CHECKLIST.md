# Route Smoke Checklist

| Route | Expected | Result | Notes |
|---|---|---|---|
| `/` | app entry/home 표시 |  |  |
| `/dashboard` | dashboard 또는 entry 표시 |  |  |
| `/pricing` | pricing/billing 안내 |  |  |
| `/reports/new` | 새 보고서 작성 화면 |  |  |
| `/reports` | 보고서 목록/필터 |  |  |
| `/reports/{knownReportId}` | 보고서 workspace |  |  |
| `/headquarters` | 사업장 기준정보 |  |  |
| `/sites` | 현장 기준정보 |  |  |
| `/photo-album` | 사진첩 grid/filter |  |  |
| `/webhard` | Drive-like 웹하드 |  |  |
| `/share/{validToken}` | public share viewer |  |  |
| `/share/{invalidToken}` | invalid/expired/revoked state |  |  |
| `/mailbox` | 메일함 상태 일관성 |  |  |
| `/mail/connect/google?error=access_denied` | Gmail connect 오류 |  |  |
| `/account` | 설정/guest import/billing |  |  |
| `/auth/google/callback?error=access_denied` | Workspace auth 오류 |  |  |
| `/billing/checkout` | checkout 또는 로그인 필요 |  |  |
| `/billing/success` | success/confirm state |  |  |
| `/billing/fail` | 결제 실패 안내 |  |  |
| `/credits` | credit 상태 또는 로그인 필요 |  |  |

# Route Smoke After Source Recovery

## 우선 route

```text
/mailbox
/mail/connect/google?error=access_denied
/photo-album
/headquarters
/sites
/reports/new
/reports
/webhard
/account
```

## 기대 결과

| Route | 기대 결과 |
|---|---|
| `/mailbox` | 메일함 shell 또는 onboarding 표시 |
| `/mail/connect/google?error=access_denied` | 오류 처리 후 mailbox로 이동 |
| `/photo-album` | 사진첩 panel 표시 |
| `/headquarters` | 사업장/현장 기준정보 화면 표시 |
| `/sites` | 현장 목록 표시 또는 로그인 안내 |
| `/reports/new` | 새 보고서 guided flow 표시 |
| `/reports` | 보고서 목록 표시 |
| `/webhard` | Drive-like 웹하드 유지 |
| `/account` | 계정/로그인 상태 표시 |

## Non-regression

- 웹하드는 Drive-like 구조에서 ERP 카드형 구조로 회귀하면 안 된다.
- 메일함은 연결 성공 메시지와 계정 없음 메시지가 동시에 표시되면 안 된다.
- 사진첩과 사업장/현장 fallback UI는 최소한 build-safe 상태여야 한다.

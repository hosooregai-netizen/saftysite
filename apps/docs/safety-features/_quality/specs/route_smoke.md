# Route Smoke Test

## 대상 route

```text
/
/reports/new
/reports
/reports/{reportId}
/headquarters
/sites
/photo-album
/webhard
/share/{token}
/mailbox
/mail/connect/google?error=access_denied
/account
/auth/google/callback?error=access_denied
/billing/checkout
/billing/success
/billing/fail
/credits
```

## 기대 결과

- `/webhard`: Drive-like workspace 표시
- `/share/{invalid}`: 만료/폐기/잘못된 링크 안내
- `/mailbox`: 계정 없음/계정 연결/목록 상태 중 하나가 일관되게 표시
- `/reports/{missing}`: 보고서 없음 error state
- `/billing/fail`: 결제 실패 안내
- `/auth/google/callback?error=access_denied`: Workspace login error 안내

## Non-regression

- 웹하드는 ERP 카드형 화면으로 회귀하면 안 된다.
- 메일함은 연결 성공 메시지와 계정 없음 메시지가 동시에 표시되면 안 된다.
- 검토 전 보고서 export CTA가 활성화되면 안 된다.

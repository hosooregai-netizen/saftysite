# Route Smoke Matrix

## 필수 route

```text
/mailbox
/mail/connect/google?error=access_denied
/photo-album
/headquarters
/sites
/reports/new
/reports
/webhard
/share/invalid-token
/account
/auth/google/callback?error=access_denied
/billing/checkout
/billing/success
/billing/fail
```

## 통과 기준

- route가 렌더링된다.
- loading/error/empty state가 명확하다.
- 권한이 필요한 route는 로그인 안내를 제공한다.
- public route는 민감 데이터를 노출하지 않는다.

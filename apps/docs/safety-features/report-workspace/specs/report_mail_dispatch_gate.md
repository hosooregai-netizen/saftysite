# Report Mail Dispatch Gate

## 흐름

```text
review complete
→ PDF/HWPX export
→ export record
→ mail prepare report
→ mailbox account connected
→ compose with attachment
→ send
```

## Gate

- report workspace access
- review completed
- export record 또는 downloadable payload
- mailbox account connected
- provider healthy
- attachment accessible

`/auth/google/callback`은 앱 로그인이고 `/mail/connect/google`은 Gmail 연결이다. 보고서 메일 발송은 앱 로그인만으로 활성화하면 안 된다.

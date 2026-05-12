# Monitoring & Alerting

## 모니터링 대상

### Backend

- `/health`
- auth login/complete failure rate
- report export failure rate
- billing confirm/webhook error
- mail OAuth complete failure
- drive public share access error
- workspace access denied spike

### Frontend

- route rendering error
- `/mail/connect/google` callback error
- `/auth/google/callback` error
- `/share/[token]` invalid/expired/revoked access
- build/runtime chunk load error

### Business metrics

- report created
- AI draft generated
- review completed
- PDF/HWPX exported
- credits purchased
- credits consumed
- webhard shares created/revoked
- Gmail accounts connected
- mails sent

## Alert severity

| Severity | Alert condition |
|---|---|
| P0 | billing double credit, public data leak, auth outage |
| P1 | report export unavailable, login failure spike |
| P2 | mailbox sync failure spike, webhard share errors |
| P3 | visual/UX issue, docs mismatch |

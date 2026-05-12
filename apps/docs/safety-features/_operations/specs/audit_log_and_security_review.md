# Audit Log & Security Review

## 감사 대상

| Area | Event |
|---|---|
| Auth | login, anonymous claim, guest import |
| Workspace | membership changes |
| Webhard | permission created/updated/deleted, share link created/revoked |
| Public share | token access, expired/revoked attempts |
| Mailbox | OAuth connect/reconnect/disconnect, send |
| Billing | checkout, confirm, webhook, credit ledger |
| Report | review complete, export |
| Directory | headquarter/site create/update/deactivate |

## Security review 주기

- Weekly: public share audit
- Monthly: workspace membership review
- Release 후: auth/billing/webhard security gate review

## 위험 신호

- 많은 invalid public share access
- 같은 paymentKey/orderId 중복 ledger
- userId/user_id mismatch 재발
- workspace 밖 resource access attempt
- Gmail reconnect_required 증가

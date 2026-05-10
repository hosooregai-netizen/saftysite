# User Support Playbook

## 자주 발생할 문의

| 문의 | 확인 |
|---|---|
| 메일 계정 연결했는데 안 보임 | mailbox account status, OAuth callback, userId/user_id |
| 보고서 출력 안 됨 | review complete, credit balance, disclaimer |
| 크레딧 결제했는데 반영 안 됨 | Toss order, BillingOrder, ledger |
| 웹하드 공유 링크 안 열림 | expired/revoked/root deleted |
| 사진첩 사진이 안 보임 | guest/auth mode, site filter |
| 현장이 안 보임 | assignment/access scope |

## 응답 원칙

- 사용자에게 내부 token/paymentKey 원문을 요구하지 않는다.
- 보안/결제 문제는 즉시 owner에게 escalation한다.
- known issue는 release notes와 연결한다.

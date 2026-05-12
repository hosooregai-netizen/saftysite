# Service Improvements Structure Note

이 폴더는 실제 서비스 개선 적용 순서를 담습니다.

## 현재 단계

```text
01 Source Recovery / Clean Build
02 Mailbox State Consistency
03 Mailbox 3-Pane & Compose
04 Gmail Send & Sync Backend
05 Mailbox Sync / Reconnect UX
06 Webhard Permission / Public Share Security
07 Webhard Share Dialog / Badges UX
08 Report / Billing / Auth Gate
09 Photo Album Grid / Filters
10 Headquarters/Sites Directory UI
11 Report Guided Upload / Review
12 Report Review / Export UX
13 Report List Status / Filters
14 Account Settings / Guest Import / Billing Entry UX
15 Final Clean Build / Route Smoke QA
16 RC Manual QA / Blocker Tracking
```

## 적용 후 검증

```bash
bash scripts/service-improvements/run-final-qa.sh
bash scripts/service-improvements/create-rc-qa-report.sh
```

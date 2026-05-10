# Step 26 Manifest: Final Release Candidate QA Package

Step 01~25에서 만든 기능별 명세, source recovery, hardening gate를 하나의 최종 release candidate QA 실행 순서로 묶는다.

## 최종 검증 축

```text
1. Clean build & source readiness
2. Route smoke
3. Security gates
4. Business workflows
5. Visual/accessibility regression
6. Docs coverage & reverse map consistency
7. Release / hold decision
```

## 대상 기능

- webhard
- mailbox
- report-workspace
- report-list
- headquarters-sites
- photo-album
- account-settings
- billing-credits
- auth-workspace
- dashboard/pricing/proxy routes

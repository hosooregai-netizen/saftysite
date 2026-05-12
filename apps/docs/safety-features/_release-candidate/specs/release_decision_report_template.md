# Release Decision Report Template

## Summary

- Candidate:
- Date:
- Reviewer:
- Decision: `Release` / `Hold` / `Conditional Release`

## Build

| Check | Result | Notes |
|---|---|---|
| frontend clean build |  |  |
| backend compile/import |  |  |
| source readiness |  |  |

## Route Smoke

| Route | Result | Notes |
|---|---|---|
| `/reports/new` |  |  |
| `/reports` |  |  |
| `/headquarters` |  |  |
| `/sites` |  |  |
| `/photo-album` |  |  |
| `/webhard` |  |  |
| `/share/{token}` |  |  |
| `/mailbox` |  |  |
| `/account` |  |  |
| `/billing/checkout` |  |  |

## Security Gates

| Gate | Result | Severity | Notes |
|---|---|---:|---|
| workspace access |  |  |  |
| public share boundary |  |  |  |
| OAuth state |  |  |  |
| billing idempotency |  |  |  |
| report export gate |  |  |  |

## Business Workflows

| Workflow | Result | Notes |
|---|---|---|
| 사업장 → 보고서 → 출력 |  |  |
| 웹하드 공유 → public viewer |  |  |
| 메일함 연결 → 작성 → 발송 |  |  |
| 사진첩 → 보고서 evidence |  |  |
| guest import → workspace |  |  |

## Visual / Accessibility

| Area | Result | Notes |
|---|---|---|
| webhard Drive-like layout |  |  |
| mailbox three-pane state |  |  |
| ERP screens |  |  |
| modal/dialog accessibility |  |  |

## Open Blockers

| ID | Severity | Feature | Summary | Owner |
|---|---:|---|---|---|

## Non-blocking Known Issues

| ID | Feature | Summary | Follow-up |
|---|---|---|---|

## Decision

```text
Release / Hold / Conditional Release
```

## Rationale

-

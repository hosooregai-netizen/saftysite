# Incident Response

## Incident flow

```text
Detection
→ classify severity
→ assign owner
→ contain impact
→ communicate status
→ patch or rollback
→ verify recovery
→ postmortem
→ docs update
```

## Severity

| Level | 예시 | 대응 |
|---|---|---|
| P0 | public share leak, billing double credit, auth token leak | 즉시 대응/rollback |
| P1 | report export outage, login outage | hotfix 또는 rollback |
| P2 | mailbox sync failure, photo upload failure | hotfix sprint |
| P3 | visual/copy issue | backlog 또는 minor patch |

## Required records

- incident id
- detection time
- affected feature
- affected users/workspaces
- root cause
- mitigation
- verification
- follow-up docs

# Rollback Runbook

## Rollback trigger

- public share data exposure
- billing double credit or wrong charge
- auth/session failure
- report export critical failure
- clean build/runtime deploy failure
- workspace access guard failure

## Rollback steps

```text
1. Freeze release
2. Identify last stable version
3. Disable affected feature if feature flag exists
4. Rollback deployment
5. Validate P0 route smoke
6. Notify support
7. Create incident report
8. Create hotfix branch if needed
```

## Post-rollback QA

- `/reports/new`
- `/reports`
- `/webhard`
- `/mailbox`
- `/account`
- `/billing/checkout`
- `/share/{known-token}`

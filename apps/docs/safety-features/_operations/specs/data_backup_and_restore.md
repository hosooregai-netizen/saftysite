# Data Backup & Restore

## 백업 대상

- users
- workspaces
- memberships
- reports
- report exports
- credit ledger
- drive items/shares/permissions
- mail accounts metadata
- photo album items
- headquarters/sites/assignments

## 복구 우선순위

1. auth/workspace
2. billing/credit ledger
3. reports/exports
4. drive share permissions
5. headquarters/sites
6. photo album
7. mailbox drafts/accounts metadata

## Drill

Monthly restore drill:

```text
1. snapshot restore to staging
2. workspace access validation
3. credit ledger reconciliation
4. report export history check
5. drive public share revoked/expired check
```

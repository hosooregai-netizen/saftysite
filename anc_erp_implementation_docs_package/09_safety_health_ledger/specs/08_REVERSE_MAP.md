# 08. Reverse Map — 안전보건대장 자동화

| Feature | Route | Component | API | Model | Prompt | Test |
|---|---|---|---|---|---|---|
| 안전보건대장 자동화 | `/safety-health-ledgers/[ledgerId]` | `LedgerRiskItemTable` | `GET /api/v1/safety-health-ledgers/{ledgerId}` | `SafetyHealthLedger, LedgerRiskItem, LedgerInspectionResult` | `safety-health-ledger-draft` | `safety_ledger_tests` |

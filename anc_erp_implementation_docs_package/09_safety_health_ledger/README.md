# 09_safety_health_ledger — 안전보건대장 자동화

Priority: `P1`

## Trace

- Route: `/safety-health-ledgers/[ledgerId]`
- Component: `LedgerRiskItemTable`
- API: `GET /api/v1/safety-health-ledgers/{ledgerId}`
- Model: `SafetyHealthLedger, LedgerRiskItem, LedgerInspectionResult`
- Prompt: `safety-health-ledger-draft`
- Tests: `safety_ledger_tests`

# 08 REVERSE PROMPT — 안전보건대장 자동화

Implement `안전보건대장 자동화`.

## Trace

- Route: `/safety-health-ledgers/[ledgerId]`
- Component: `LedgerRiskItemTable`
- API: `GET /api/v1/safety-health-ledgers/{ledgerId}`
- Models: `SafetyHealthLedger, LedgerRiskItem, LedgerInspectionResult`
- Prompt: `safety-health-ledger-draft`
- Tests: `safety_ledger_tests`

## Instructions

1. Read all specs in this feature folder.
2. Keep business logic in services.
3. Keep owner-specific data isolated.
4. Add tests and update Reverse Map.
5. Do not introduce external integrations unless the feature specifically requires them.

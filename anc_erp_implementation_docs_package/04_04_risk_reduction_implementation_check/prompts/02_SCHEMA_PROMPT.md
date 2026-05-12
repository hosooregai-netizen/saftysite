# 02 SCHEMA PROMPT — 위험성 감소대책 이행확인

Implement `위험성 감소대책 이행확인`.

## Trace

- Route: `/risk-reduction-forms/[formId]/edit`
- Component: `RiskReductionItemTable`
- API: `GET /api/v1/risk-reduction-forms/{formId}`
- Models: `RiskReductionImplementationForm, RiskReductionItem`
- Prompt: `risk-reduction-summary`
- Tests: `risk_reduction_tests`

## Instructions

1. Read all specs in this feature folder.
2. Keep business logic in services.
3. Keep owner-specific data isolated.
4. Add tests and update Reverse Map.
5. Do not introduce external integrations unless the feature specifically requires them.

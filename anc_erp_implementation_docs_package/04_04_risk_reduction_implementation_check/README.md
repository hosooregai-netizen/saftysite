# 04_04_risk_reduction_implementation_check — 위험성 감소대책 이행확인

Priority: `P0`

## Trace

- Route: `/risk-reduction-forms/[formId]/edit`
- Component: `RiskReductionItemTable`
- API: `GET /api/v1/risk-reduction-forms/{formId}`
- Model: `RiskReductionImplementationForm, RiskReductionItem`
- Prompt: `risk-reduction-summary`
- Tests: `risk_reduction_tests`

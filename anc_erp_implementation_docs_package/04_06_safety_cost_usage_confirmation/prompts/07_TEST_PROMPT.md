# 07 TEST PROMPT — 산업안전보건관리비 사용 내용 확인

Implement `산업안전보건관리비 사용 내용 확인`.

## Trace

- Route: `/safety-cost-usage-confirmation-forms/[formId]/edit`
- Component: `SafetyCostUsageForm`
- API: `GET /api/v1/safety-cost-usage-confirmation-forms/{formId}`
- Models: `SafetyCostUsageConfirmationForm`
- Prompt: `safety-cost-usage-comment`
- Tests: `safety_cost_tests`

## Instructions

1. Read all specs in this feature folder.
2. Keep business logic in services.
3. Keep owner-specific data isolated.
4. Add tests and update Reverse Map.
5. Do not introduce external integrations unless the feature specifically requires them.

# 03 BACKEND IMPLEMENTATION — 안전관리계획서 자동화

Implement `안전관리계획서 자동화`.

## Trace

- Route: `/safety-management-plans/[planId]`
- Component: `PlanSectionEditor`
- API: `GET /api/v1/safety-management-plans/{planId}`
- Models: `SafetyManagementPlan, SafetyManagementPlanSection, SafetyManagementRiskItem`
- Prompt: `safety-management-plan-draft`
- Tests: `safety_plan_tests`

## Instructions

1. Read all specs in this feature folder.
2. Keep business logic in services.
3. Keep owner-specific data isolated.
4. Add tests and update Reverse Map.
5. Do not introduce external integrations unless the feature specifically requires them.

# 08_safety_management_plan — 안전관리계획서 자동화

Priority: `P1`

## Trace

- Route: `/safety-management-plans/[planId]`
- Component: `PlanSectionEditor`
- API: `GET /api/v1/safety-management-plans/{planId}`
- Model: `SafetyManagementPlan, SafetyManagementPlanSection, SafetyManagementRiskItem`
- Prompt: `safety-management-plan-draft`
- Tests: `safety_plan_tests`

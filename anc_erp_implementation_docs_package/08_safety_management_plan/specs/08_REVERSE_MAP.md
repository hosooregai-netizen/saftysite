# 08. Reverse Map — 안전관리계획서 자동화

| Feature | Route | Component | API | Model | Prompt | Test |
|---|---|---|---|---|---|---|
| 안전관리계획서 자동화 | `/safety-management-plans/[planId]` | `PlanSectionEditor` | `GET /api/v1/safety-management-plans/{planId}` | `SafetyManagementPlan, SafetyManagementPlanSection, SafetyManagementRiskItem` | `safety-management-plan-draft` | `safety_plan_tests` |

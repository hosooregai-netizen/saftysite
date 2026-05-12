# 03 BACKEND IMPLEMENTATION — 프로젝트/현장 원장 관리

Implement `프로젝트/현장 원장 관리`.

## Trace

- Route: `/projects/[projectId]`
- Component: `ProjectSummaryCard`
- API: `GET /api/v1/projects/{projectId}`
- Models: `Project, Organization, ProjectParty, Contact`
- Prompt: `project-info-extraction`
- Tests: `project_registry_tests`

## Instructions

1. Read all specs in this feature folder.
2. Keep business logic in services.
3. Keep owner-specific data isolated.
4. Add tests and update Reverse Map.
5. Do not introduce external integrations unless the feature specifically requires them.

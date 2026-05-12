# 01_project_field_registry — 프로젝트/현장 원장 관리

Priority: `P0`

## Trace

- Route: `/projects/[projectId]`
- Component: `ProjectSummaryCard`
- API: `GET /api/v1/projects/{projectId}`
- Model: `Project, Organization, ProjectParty, Contact`
- Prompt: `project-info-extraction`
- Tests: `project_registry_tests`

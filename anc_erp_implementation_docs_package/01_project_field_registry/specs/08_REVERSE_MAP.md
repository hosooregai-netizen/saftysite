# 08. Reverse Map — 프로젝트/현장 원장 관리

| Feature | Route | Component | API | Model | Prompt | Test |
|---|---|---|---|---|---|---|
| 프로젝트/현장 원장 관리 | `/projects/[projectId]` | `ProjectSummaryCard` | `GET /api/v1/projects/{projectId}` | `Project, Organization, ProjectParty, Contact` | `project-info-extraction` | `project_registry_tests` |

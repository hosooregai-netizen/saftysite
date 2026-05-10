Implement Feature 08: 안전관리계획서 자동화 for A&C 기술사 ERP.

Source of truth:
- AGENTS.md
- docs/aec-erp/00-overall/*
- docs/aec-erp/08-safety-management-plan/README.md if it exists
- docs/aec-erp/08-safety-management-plan/markdown/01_PRODUCT_MARKDOWN.md if it exists
- docs/aec-erp/08-safety-management-plan/markdown/02_TECH_MARKDOWN.md if it exists
- docs/aec-erp/08-safety-management-plan/markdown/05_DESIGN_MARKDOWN.md if it exists
- docs/aec-erp/08-safety-management-plan/markdown/07_REVERSE_MAP.md if it exists
- docs/aec-erp/08-safety-management-plan/prompts/04_CODEX_IMPLEMENTATION_PROMPT.md if it exists

Implement only this feature.

Actual containment:
- Parent/container: Project Document
- Primary UI location: Project Detail > Documents > Safety Management Plan

Primary routes:
- /projects/[projectId]/documents/safety-management-plans
- /documents/safety-management-plans/[documentId]

Required process:
1. Summarize the planned implementation before coding.
2. Implement backend models, repositories, services, and APIs from the feature docs.
3. Implement frontend routes and components from the feature docs.
4. Preserve parent-child containment.
5. Add or update tests listed in the feature docs.
6. Run tests.
7. Report changed files and any deviations.

Rules:
- Do not implement future features.
- Do not invent business facts, legal text, dates, amounts, organizations, or report facts.
- Keep AI output as draft.
- Use `projectId` as root key when applicable.
- Use `inspectionRoundId` for round-scoped data.
- Use `ownerPartyId` for owner-specific reports.
- Use latest saved snapshot for exports.

Implement Feature 07: 산업안전보건관리비 사용내용 확인 for A&C 기술사 ERP.

Source of truth:
- AGENTS.md
- docs/aec-erp/00-overall/*
- docs/aec-erp/07-safety-cost-usage/README.md if it exists
- docs/aec-erp/07-safety-cost-usage/markdown/01_PRODUCT_MARKDOWN.md if it exists
- docs/aec-erp/07-safety-cost-usage/markdown/02_TECH_MARKDOWN.md if it exists
- docs/aec-erp/07-safety-cost-usage/markdown/05_DESIGN_MARKDOWN.md if it exists
- docs/aec-erp/07-safety-cost-usage/markdown/07_REVERSE_MAP.md if it exists
- docs/aec-erp/07-safety-cost-usage/prompts/04_CODEX_IMPLEMENTATION_PROMPT.md if it exists

Implement only this feature.

Actual containment:
- Parent/container: InspectionRound + OwnerParty + Document section
- Primary UI location: Inspection Round Detail > Safety Cost tab; Document > safety_cost_usage section

Primary routes:
- /projects/[projectId]/safety-costs
- /inspections/[inspectionRoundId]/safety-costs
- /documents/safety-reports/[documentId]/sections/safety_cost_usage

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

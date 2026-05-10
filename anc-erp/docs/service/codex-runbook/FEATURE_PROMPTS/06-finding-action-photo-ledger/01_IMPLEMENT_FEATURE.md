Implement Feature 06: 지적사항/조치현황/사진대지 for A&C 기술사 ERP.

Source of truth:
- AGENTS.md
- docs/aec-erp/00-overall/*
- docs/aec-erp/06-finding-action-photo-ledger/README.md if it exists
- docs/aec-erp/06-finding-action-photo-ledger/markdown/01_PRODUCT_MARKDOWN.md if it exists
- docs/aec-erp/06-finding-action-photo-ledger/markdown/02_TECH_MARKDOWN.md if it exists
- docs/aec-erp/06-finding-action-photo-ledger/markdown/05_DESIGN_MARKDOWN.md if it exists
- docs/aec-erp/06-finding-action-photo-ledger/markdown/07_REVERSE_MAP.md if it exists
- docs/aec-erp/06-finding-action-photo-ledger/prompts/04_CODEX_IMPLEMENTATION_PROMPT.md if it exists

Implement only this feature.

Actual containment:
- Parent/container: InspectionRound + Document section
- Primary UI location: Inspection Round Detail > Findings/Photo Ledger tabs; Document > photo_ledger section

Primary routes:
- /inspections/[inspectionRoundId]/findings
- /inspections/[inspectionRoundId]/photo-ledger
- /documents/safety-reports/[documentId]/sections/photo_ledger

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

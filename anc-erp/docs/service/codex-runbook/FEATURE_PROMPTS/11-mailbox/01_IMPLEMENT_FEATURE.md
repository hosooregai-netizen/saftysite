Implement Feature 11: 메일함 for A&C 기술사 ERP.

Source of truth:
- AGENTS.md
- docs/service/docs/aec-erp/00-overall/*
- docs/service/docs/aec-erp/11-mailbox/README.md if it exists
- docs/service/docs/aec-erp/11-mailbox/markdown/01_PRODUCT_MARKDOWN.md if it exists
- docs/service/docs/aec-erp/11-mailbox/markdown/02_TECH_MARKDOWN.md if it exists
- docs/service/docs/aec-erp/11-mailbox/markdown/05_DESIGN_MARKDOWN.md if it exists
- docs/service/docs/aec-erp/11-mailbox/markdown/07_REVERSE_MAP.md if it exists
- docs/service/docs/aec-erp/11-mailbox/prompts/04_CODEX_IMPLEMENTATION_PROMPT.md if it exists
- Existing parity baseline under apps/web/app/mailbox and apps/web/features/mailbox/*

Implement only this feature.

Actual containment:
- Parent/container: Full-screen app + Project/Document/Submission linked communication layer
- Primary UI location: Mailbox 3-pane shell; Project Detail > Mail tab

Primary routes:
- /mail
- /mail/compose
- /projects/[projectId]/mail

Required process:
1. Summarize the planned implementation before coding.
2. Implement backend models, repositories, services, and APIs from the feature docs.
3. Implement frontend routes and components from the feature docs.
4. Preserve parent-child containment.
5. Add or update tests listed in the feature docs.
6. Run tests.
7. Report changed files and any deviations.
8. Port the existing `apps/web` 3-pane mailbox structure and account/thread/detail workflow before introducing anc-erp-specific simplifications.

Rules:
- Do not implement future features.
- Do not invent business facts, legal text, dates, amounts, organizations, or report facts.
- Keep AI output as draft.
- Use `projectId` as root key when applicable.
- Use `inspectionRoundId` for round-scoped data.
- Use `ownerPartyId` for owner-specific reports.
- Use latest saved snapshot for exports.
- Keep the A&C ERP containment model and `/mail` route naming, but treat the existing `apps/web` mailbox host UX as the baseline for pane structure, filters, and message workflow.

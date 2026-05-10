Implement Feature 10: 웹하드 for A&C 기술사 ERP.

Source of truth:
- AGENTS.md
- docs/service/docs/aec-erp/00-overall/*
- docs/service/docs/aec-erp/10-webhard/README.md if it exists
- docs/service/docs/aec-erp/10-webhard/markdown/01_PRODUCT_MARKDOWN.md if it exists
- docs/service/docs/aec-erp/10-webhard/markdown/02_TECH_MARKDOWN.md if it exists
- docs/service/docs/aec-erp/10-webhard/markdown/05_DESIGN_MARKDOWN.md if it exists
- docs/service/docs/aec-erp/10-webhard/markdown/07_REVERSE_MAP.md if it exists
- docs/service/docs/aec-erp/10-webhard/prompts/04_CODEX_IMPLEMENTATION_PROMPT.md if it exists
- Existing parity baseline under apps/web/app/webhard and apps/web/features/drive/*

Implement only this feature.

Actual containment:
- Parent/container: Full-screen app + Project-linked file layer
- Primary UI location: Webhard shell; Project Detail > Webhard tab

Primary routes:
- /webhard
- /webhard/projects/[projectId]
- /projects/[projectId]/webhard

Required process:
1. Summarize the planned implementation before coding.
2. Implement backend models, repositories, services, and APIs from the feature docs.
3. Implement frontend routes and components from the feature docs.
4. Preserve parent-child containment.
5. Add or update tests listed in the feature docs.
6. Run tests.
7. Report changed files and any deviations.
8. Port the existing `apps/web` full-screen file-manager information architecture and workspace flow before introducing new anc-erp-specific simplifications.

Rules:
- Do not implement future features.
- Do not invent business facts, legal text, dates, amounts, organizations, or report facts.
- Keep AI output as draft.
- Use `projectId` as root key when applicable.
- Use `inspectionRoundId` for round-scoped data.
- Use `ownerPartyId` for owner-specific reports.
- Use latest saved snapshot for exports.
- Keep the A&C ERP containment model, but treat the existing `apps/web` webhard host UX as the baseline for shell structure, navigation, and detail/preview flow.

Implement Feature 00: 전체 골격 / Bootstrap for A&C 기술사 ERP.

Source of truth:
- AGENTS.md
- docs/service/docs/aec-erp/00-overall/*
- docs/service/docs/aec-erp/00-overall/README.md if it exists
- docs/service/docs/aec-erp/00-overall/markdown/01_PRODUCT_MARKDOWN.md if it exists
- docs/service/docs/aec-erp/00-overall/markdown/02_TECH_MARKDOWN.md if it exists
- docs/service/docs/aec-erp/00-overall/markdown/05_DESIGN_MARKDOWN.md if it exists
- docs/service/docs/aec-erp/00-overall/markdown/07_REVERSE_MAP.md if it exists
- docs/service/docs/aec-erp/00-overall/prompts/04_CODEX_IMPLEMENTATION_PROMPT.md if it exists
- Existing parity baseline under apps/web for dashboard, project/report hub, webhard host, and mailbox host UX

Implement only this feature.

Actual containment:
- Parent/container: repository root / docs
- Primary UI location: Repository + ERP shell

Primary routes:
- /dashboard
- /projects
- /webhard
- /mail
- /admin

Required process:
1. Summarize the planned implementation before coding.
2. Implement backend models, repositories, services, and APIs from the feature docs.
3. Implement frontend routes and components from the feature docs.
4. Preserve parent-child containment.
5. Add or update tests listed in the feature docs.
6. Run tests.
7. Report changed files and any deviations.
8. When the docs say to bring over an existing ERP or apps experience, port the information architecture and workflow shape from `apps/web` instead of replacing it with a thinner skeleton.

Rules:
- Do not implement future features.
- Do not invent business facts, legal text, dates, amounts, organizations, or report facts.
- Keep AI output as draft.
- Use `projectId` as root key when applicable.
- Use `inspectionRoundId` for round-scoped data.
- Use `ownerPartyId` for owner-specific reports.
- Use latest saved snapshot for exports.
- Preserve intended parity with the existing `apps/web` shell and host navigation where the overall docs call it out, unless the A&C ERP docs explicitly changed the route or ownership model.

You are implementing only the initial technical skeleton for A&C 기술사 ERP.

Read:
- AGENTS.md
- docs/aec-erp/00-overall/*
- docs/aec-erp/_json/features.json
- docs/aec-erp/_json/containment_map.json

Implement:
1. Monorepo skeleton.
2. Next.js App Router frontend skeleton.
3. FastAPI backend skeleton.
4. Shared API client.
5. InMemory repository base.
6. Health check endpoint.
7. Basic ERP shell layout.
8. Placeholder navigation for all modules.
9. No full business module yet.

Rules:
- Do not implement all features.
- Use feature folders as implementation units, not standalone apps.
- Preserve Project → InspectionRound → DocumentInstance containment.
- Add basic tests for health check and app boot.

After coding:
- Run tests.
- Report changed files.
- Report what remains for Feature 01.

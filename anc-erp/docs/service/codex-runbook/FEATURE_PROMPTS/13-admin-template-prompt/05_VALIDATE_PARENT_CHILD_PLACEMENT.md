Validate parent-child placement before implementing 관리자/템플릿/프롬프트.

Read:
- AGENTS.md
- docs/aec-erp/00-overall/05_MODULE_CONTAINMENT_MAP.md
- docs/aec-erp/_json/containment_map.json
- docs/aec-erp/13-admin-template-prompt/markdown/07_REVERSE_MAP.md if it exists

Expected actual parent/container:
- Admin module
- Admin shell

Primary routes:
- /admin
- /admin/templates
- /admin/prompts
- /admin/checklists

Task:
1. Check whether this feature is being implemented in its correct parent container.
2. Reject any design that treats this feature as a detached standalone app when it should be under Project, InspectionRound, or DocumentInstance.
3. Identify required foreign keys: projectId, inspectionRoundId, ownerPartyId, documentId, fileId, mailThreadId, or submissionId.
4. Return a PASS/FAIL containment verdict.
5. If FAIL, return the corrected route/model/component placement.

Do not modify files yet.

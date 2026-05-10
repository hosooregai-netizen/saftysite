Validate parent-child placement before implementing 점검회차/일정 관리.

Read:
- AGENTS.md
- docs/aec-erp/00-overall/05_MODULE_CONTAINMENT_MAP.md
- docs/aec-erp/_json/containment_map.json
- docs/aec-erp/03-inspection-schedule/markdown/07_REVERSE_MAP.md if it exists

Expected actual parent/container:
- Project
- Project Detail > Inspection Rounds tab

Primary routes:
- /projects/[projectId]/inspections
- /inspections/[inspectionRoundId]
- /calendar/inspections

Task:
1. Check whether this feature is being implemented in its correct parent container.
2. Reject any design that treats this feature as a detached standalone app when it should be under Project, InspectionRound, or DocumentInstance.
3. Identify required foreign keys: projectId, inspectionRoundId, ownerPartyId, documentId, fileId, mailThreadId, or submissionId.
4. Return a PASS/FAIL containment verdict.
5. If FAIL, return the corrected route/model/component placement.

Do not modify files yet.

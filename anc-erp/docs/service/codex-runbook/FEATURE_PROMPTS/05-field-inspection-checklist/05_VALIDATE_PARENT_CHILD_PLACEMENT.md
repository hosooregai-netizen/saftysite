Validate parent-child placement before implementing 현장점검 체크리스트.

Read:
- AGENTS.md
- docs/aec-erp/00-overall/05_MODULE_CONTAINMENT_MAP.md
- docs/aec-erp/_json/containment_map.json
- docs/aec-erp/05-field-inspection-checklist/markdown/07_REVERSE_MAP.md if it exists

Expected actual parent/container:
- InspectionRound
- Inspection Round Detail > Checklist tab

Primary routes:
- /inspections/[inspectionRoundId]/checklist
- /inspections/[inspectionRoundId]/checklist/mobile
- /inspections/[inspectionRoundId]/checklist/review

Task:
1. Check whether this feature is being implemented in its correct parent container.
2. Reject any design that treats this feature as a detached standalone app when it should be under Project, InspectionRound, or DocumentInstance.
3. Identify required foreign keys: projectId, inspectionRoundId, ownerPartyId, documentId, fileId, mailThreadId, or submissionId.
4. Return a PASS/FAIL containment verdict.
5. If FAIL, return the corrected route/model/component placement.

Do not modify files yet.

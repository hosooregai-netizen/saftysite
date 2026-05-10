Validate parent-child placement before implementing 지적사항/조치현황/사진대지.

Read:
- AGENTS.md
- docs/aec-erp/00-overall/05_MODULE_CONTAINMENT_MAP.md
- docs/aec-erp/_json/containment_map.json
- docs/aec-erp/06-finding-action-photo-ledger/markdown/07_REVERSE_MAP.md if it exists

Expected actual parent/container:
- InspectionRound + Document section
- Inspection Round Detail > Findings/Photo Ledger tabs; Document > photo_ledger section

Primary routes:
- /inspections/[inspectionRoundId]/findings
- /inspections/[inspectionRoundId]/photo-ledger
- /documents/safety-reports/[documentId]/sections/photo_ledger

Task:
1. Check whether this feature is being implemented in its correct parent container.
2. Reject any design that treats this feature as a detached standalone app when it should be under Project, InspectionRound, or DocumentInstance.
3. Identify required foreign keys: projectId, inspectionRoundId, ownerPartyId, documentId, fileId, mailThreadId, or submissionId.
4. Return a PASS/FAIL containment verdict.
5. If FAIL, return the corrected route/model/component placement.

Do not modify files yet.

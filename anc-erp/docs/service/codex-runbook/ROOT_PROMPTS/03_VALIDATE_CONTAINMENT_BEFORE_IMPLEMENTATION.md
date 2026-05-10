Before implementing any feature, validate containment.

Read:
- AGENTS.md
- docs/aec-erp/00-overall/05_MODULE_CONTAINMENT_MAP.md
- docs/aec-erp/_json/containment_map.json

Task:
1. Confirm that feature folders are implementation units, not detached apps.
2. Identify each feature's actual parent container.
3. Identify primary routes and allowed global queue routes.
4. Identify data models that must include projectId, inspectionRoundId, ownerPartyId, or documentId.
5. Return any route/model design that would violate containment.

Do not modify files.

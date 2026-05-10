Act as a bootstrap QA and reverse mapping auditor.

Read:
- docs/aec-erp/00-overall/10_GLOBAL_REVERSE_MAP.md
- docs/aec-erp/00-overall/05_MODULE_CONTAINMENT_MAP.md
- docs/aec-erp/_json/containment_map.json

Review the current skeleton implementation.

Check:
1. Does the repository have frontend/backend skeletons?
2. Is AGENTS.md respected?
3. Does navigation show all modules without implementing them as detached apps?
4. Are Project-contained modules represented as project tabs or placeholders?
5. Are Webhard and Mailbox full-screen shells but still project-linkable?
6. Are tests present?

Return PASS/FAIL and a patch plan.
Do not modify files yet.

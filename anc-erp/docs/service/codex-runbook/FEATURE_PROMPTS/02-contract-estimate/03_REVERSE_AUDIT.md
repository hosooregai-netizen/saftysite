Act as a Reverse Mapping Auditor for Feature 02: 계약/견적 관리.

Read:
- AGENTS.md
- docs/aec-erp/00-overall/05_MODULE_CONTAINMENT_MAP.md
- docs/aec-erp/02-contract-estimate/markdown/07_REVERSE_MAP.md if it exists
- docs/aec-erp/02-contract-estimate/prompts/08_REVERSE_PROMPT.md if it exists

Review the current implementation.

Check:
1. Are all required routes implemented?
2. Are all required components implemented?
3. Are all APIs implemented?
4. Are all models implemented?
5. Are all tests implemented?
6. Is parent-child containment correct?
7. Are downstream dependencies preserved?
8. Are there invented fields or missing constraints?
9. Are any future modules implemented prematurely?

Return:
```json
{
  "status": "PASS | FAIL",
  "missingRoutes": [],
  "missingComponents": [],
  "missingApis": [],
  "missingModels": [],
  "missingTests": [],
  "containmentGaps": [],
  "businessRuleGaps": [],
  "riskyImplementationChoices": [],
  "recommendedPatchPlan": []
}
```

Do not modify files yet.

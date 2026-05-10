Act as a Reverse Mapping Auditor for Feature 10: 웹하드.

Read:
- AGENTS.md
- docs/service/docs/aec-erp/00-overall/05_MODULE_CONTAINMENT_MAP.md
- docs/service/docs/aec-erp/10-webhard/markdown/07_REVERSE_MAP.md if it exists
- docs/service/docs/aec-erp/10-webhard/prompts/08_REVERSE_PROMPT.md if it exists
- Existing `apps/web` webhard host UX as a parity baseline

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
10. Does the resulting shell and flow preserve parity with the existing `apps/web` full-screen webhard experience while keeping ERP linkage visible?

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
  "parityGaps": [],
  "riskyImplementationChoices": [],
  "recommendedPatchPlan": []
}
```

Do not modify files yet.

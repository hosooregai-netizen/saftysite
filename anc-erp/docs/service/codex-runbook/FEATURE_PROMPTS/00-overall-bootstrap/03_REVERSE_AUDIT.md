Act as a Reverse Mapping Auditor for Feature 00: 전체 골격 / Bootstrap.

Read:
- AGENTS.md
- docs/service/docs/aec-erp/00-overall/05_MODULE_CONTAINMENT_MAP.md
- docs/service/docs/aec-erp/00-overall/markdown/07_REVERSE_MAP.md if it exists
- docs/service/docs/aec-erp/00-overall/prompts/08_REVERSE_PROMPT.md if it exists
- Existing `apps/web` dashboard, project/report hub, webhard, and mailbox UX as a parity baseline where the docs call for carrying over existing experience

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
10. Does the shell, route structure, and key workflow shape preserve intended parity with the existing `apps/web` baseline instead of collapsing into a thinner skeleton?

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

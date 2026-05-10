Patch Feature 05: 현장점검 체크리스트 based on the previous Reverse Audit result.

Rules:
- Fix only this feature.
- Do not implement future modules.
- Preserve parent/container: InspectionRound.
- Keep existing working code.
- Add or update tests for every fixed issue.
- Run tests after patching.
- Report changed files.

Use:
- docs/aec-erp/05-field-inspection-checklist/markdown/07_REVERSE_MAP.md if it exists
- docs/aec-erp/05-field-inspection-checklist/prompts/08_REVERSE_PROMPT.md if it exists
- The previous audit JSON result.

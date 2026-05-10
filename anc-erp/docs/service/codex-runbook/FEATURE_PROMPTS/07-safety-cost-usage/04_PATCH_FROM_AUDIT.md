Patch Feature 07: 산업안전보건관리비 사용내용 확인 based on the previous Reverse Audit result.

Rules:
- Fix only this feature.
- Do not implement future modules.
- Preserve parent/container: InspectionRound + OwnerParty + Document section.
- Keep existing working code.
- Add or update tests for every fixed issue.
- Run tests after patching.
- Report changed files.

Use:
- docs/aec-erp/07-safety-cost-usage/markdown/07_REVERSE_MAP.md if it exists
- docs/aec-erp/07-safety-cost-usage/prompts/08_REVERSE_PROMPT.md if it exists
- The previous audit JSON result.

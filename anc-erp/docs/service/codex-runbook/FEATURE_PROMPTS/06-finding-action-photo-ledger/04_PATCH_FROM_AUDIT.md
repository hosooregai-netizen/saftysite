Patch Feature 06: 지적사항/조치현황/사진대지 based on the previous Reverse Audit result.

Rules:
- Fix only this feature.
- Do not implement future modules.
- Preserve parent/container: InspectionRound + Document section.
- Keep existing working code.
- Add or update tests for every fixed issue.
- Run tests after patching.
- Report changed files.

Use:
- docs/aec-erp/06-finding-action-photo-ledger/markdown/07_REVERSE_MAP.md if it exists
- docs/aec-erp/06-finding-action-photo-ledger/prompts/08_REVERSE_PROMPT.md if it exists
- The previous audit JSON result.

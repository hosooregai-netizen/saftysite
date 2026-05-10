Patch Feature 12: 결재/서명/제출 based on the previous Reverse Audit result.

Rules:
- Fix only this feature.
- Do not implement future modules.
- Preserve parent/container: DocumentInstance.
- Keep existing working code.
- Add or update tests for every fixed issue.
- Run tests after patching.
- Report changed files.

Use:
- docs/aec-erp/12-approval-signature-submission/markdown/07_REVERSE_MAP.md if it exists
- docs/aec-erp/12-approval-signature-submission/prompts/08_REVERSE_PROMPT.md if it exists
- The previous audit JSON result.

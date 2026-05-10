Patch Feature 13: 관리자/템플릿/프롬프트 based on the previous Reverse Audit result.

Rules:
- Fix only this feature.
- Do not implement future modules.
- Preserve parent/container: Admin module.
- Keep existing working code.
- Add or update tests for every fixed issue.
- Run tests after patching.
- Report changed files.

Use:
- docs/aec-erp/13-admin-template-prompt/markdown/07_REVERSE_MAP.md if it exists
- docs/aec-erp/13-admin-template-prompt/prompts/08_REVERSE_PROMPT.md if it exists
- The previous audit JSON result.

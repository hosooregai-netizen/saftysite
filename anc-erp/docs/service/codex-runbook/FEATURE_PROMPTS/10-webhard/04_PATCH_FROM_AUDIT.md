Patch Feature 10: 웹하드 based on the previous Reverse Audit result.

Rules:
- Fix only this feature.
- Do not implement future modules.
- Preserve parent/container: Full-screen app + Project-linked file layer.
- Keep existing working code.
- Add or update tests for every fixed issue.
- Run tests after patching.
- Report changed files.
- If the audit flagged `parityGaps`, patch the host layout, navigation, and file workflow so they are closer to the existing `apps/web` baseline without undoing A&C ERP containment rules.

Use:
- docs/service/docs/aec-erp/10-webhard/markdown/07_REVERSE_MAP.md if it exists
- docs/service/docs/aec-erp/10-webhard/prompts/08_REVERSE_PROMPT.md if it exists
- The previous audit JSON result.

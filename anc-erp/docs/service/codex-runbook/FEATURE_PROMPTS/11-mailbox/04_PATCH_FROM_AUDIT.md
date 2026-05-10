Patch Feature 11: 메일함 based on the previous Reverse Audit result.

Rules:
- Fix only this feature.
- Do not implement future modules.
- Preserve parent/container: Full-screen app + Project/Document/Submission linked communication layer.
- Keep existing working code.
- Add or update tests for every fixed issue.
- Run tests after patching.
- Report changed files.
- If the audit flagged `parityGaps`, patch the host layout, account/thread/detail flow, and compose entry points so they are closer to the existing `apps/web` baseline without undoing A&C ERP containment rules.

Use:
- docs/service/docs/aec-erp/11-mailbox/markdown/07_REVERSE_MAP.md if it exists
- docs/service/docs/aec-erp/11-mailbox/prompts/08_REVERSE_PROMPT.md if it exists
- The previous audit JSON result.

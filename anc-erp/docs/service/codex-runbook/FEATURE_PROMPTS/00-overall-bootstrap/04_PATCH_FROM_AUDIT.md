Patch Feature 00: 전체 골격 / Bootstrap based on the previous Reverse Audit result.

Rules:
- Fix only this feature.
- Do not implement future modules.
- Preserve parent/container: repository root / docs.
- Keep existing working code.
- Add or update tests for every fixed issue.
- Run tests after patching.
- Report changed files.
- If the audit flagged `parityGaps`, patch the `apps/web` baseline mismatch without violating A&C ERP route or containment changes that are explicitly documented.

Use:
- docs/service/docs/aec-erp/00-overall/markdown/07_REVERSE_MAP.md if it exists
- docs/service/docs/aec-erp/00-overall/prompts/08_REVERSE_PROMPT.md if it exists
- The previous audit JSON result.

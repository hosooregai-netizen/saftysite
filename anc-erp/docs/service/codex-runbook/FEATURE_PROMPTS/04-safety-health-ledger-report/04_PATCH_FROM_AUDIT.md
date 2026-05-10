Patch Feature 04: 공사안전보건대장 이행확인 보고서 자동화 based on the previous Reverse Audit result.

Rules:
- Fix only this feature.
- Do not implement future modules.
- Preserve parent/container: Project + InspectionRound + OwnerParty.
- Keep existing working code.
- Add or update tests for every fixed issue.
- Run tests after patching.
- Report changed files.

Use:
- docs/aec-erp/04-safety-health-ledger-report/markdown/07_REVERSE_MAP.md if it exists
- docs/aec-erp/04-safety-health-ledger-report/prompts/08_REVERSE_PROMPT.md if it exists
- The previous audit JSON result.

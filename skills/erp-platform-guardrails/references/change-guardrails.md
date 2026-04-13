# Change Guardrails for Vibe Coding

## Default Risks

Rapid code generation tends to cause:

- missing routes after refactors
- stale UI markers after copy changes
- API calls drifting from screen state
- large-file rewrites that silently drop behavior

## Required Sequence

Follow this order for ERP client work:

1. Read the affected feature contract
2. Add or adjust smoke coverage
3. Change code
4. Re-run the targeted smoke

## Strong Defaults

- Patch the smallest feature surface possible.
- Avoid mixing unrelated features in one change.
- Avoid changing shared platform helpers without checking all dependent feature contracts.
- When a file is already large, split responsibility before appending another unrelated branch of logic.
- If a feature cannot be smoke-tested yet, mark it explicitly as unprotected and add coverage next.

## AIDLC Defaults

- Prefer edited files under roughly 200 lines when practical.
- Treat 300+ line ERP files as split candidates, not as default landing zones for new work.
- Keep the AI context bundle explicit: contract, target file, nearest shared interface, and `ARCHITECTURE.md` if ownership is unclear.
- Split with a hybrid rule: visible workflow boundary first, then shell/controller/helper/section/modal responsibilities inside it.

## Review Checklist

- Which contract changed?
- Which smoke was run?
- Which platform/industry/tenant layer owns the new behavior?
- Did any shared route, cache, or state primitive change?
- Is the feature still discoverable through the same critical marker text?

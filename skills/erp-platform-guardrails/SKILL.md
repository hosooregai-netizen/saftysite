---
name: erp-platform-guardrails
description: Use for ERP platform work that must preserve feature contracts, follow platform-plus-industry-pack modularity, and update Playwright smoke coverage before or with client-side changes.
---

# ERP Platform Guardrails

Use this skill when the task changes ERP client behavior, introduces a new ERP module, or risks regression from rapid iterative coding.

## Focus

- `features/home/**`
- `features/mailbox/**`
- `features/mobile/**`
- `features/site-reports/**`
- `app/sites/**`
- client-side feature contracts and Playwright smoke coverage
- platform core vs industry pack vs tenant config boundaries

## Workflow

1. Work in the active `saftysite-real/main` branch and confirm which local changes belong to the task before editing.
2. Read `ARCHITECTURE.md` if ownership or layering is unclear.
3. Identify the affected feature contract in `tests/client/featureContracts.ts`.
4. If the feature has no contract or smoke, add it before or with the code change.
5. Treat shared capabilities as platform code first; avoid baking industry rules directly into generic screens or API clients.
6. Validate in this order: `npm run lint`, `npx tsc --noEmit --pretty false`, targeted client smoke.
7. Run `npm run aidlc:audit` when a change grows the ERP surface or touches large files.

## Guardrails

- Do not treat a feature as complete if no smoke contract protects it.
- Do not solve industry differences with ad hoc conditionals when a provider/registry/config boundary is possible.
- Do not overwrite large files wholesale; patch the smallest feature-level surface possible.
- Default to files under roughly 200 lines when practical; split responsibility before adding more logic to 300+ line files.
- Prefer a hybrid split: flow-level boundary first, then shell/controller/helper/section/modal boundaries inside that flow.
- When routing, state, and API calls change together, update the feature contract and smoke in the same change.

## References

- Architecture guide: `../../ARCHITECTURE.md`
- Modularity guide: `references/modularity.md`
- AIDLC guide: `references/aidlc.md`
- Testing guide: `references/testing.md`
- Change guardrails: `references/change-guardrails.md`

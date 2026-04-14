# ERP Architecture Guardrails

This repo should evolve as a reusable ERP platform rather than a sequence of per-industry forks.

## Layer Model

Use three layers when deciding where behavior belongs.

### 1. Platform Core

Shared capabilities that should remain reusable across ERP families:

- auth and shell
- site, worker, user, assignment entities
- API client and caching primitives
- document engines, upload/download flows
- messaging, notification, audit primitives
- feature contract and smoke-test infrastructure

### 2. Industry Pack

Industry-specific behavior should live behind a provider, registry, or config boundary:

- workflow steps and allowed transitions
- document and report kinds
- terminology and copy
- content packs and templates
- integration adapters

Do not scatter `if industry === ...` branches through shared screens.

### 3. Tenant Config

Customer-specific differences should be configuration, not code forks:

- branding
- organization structure
- permissions and policy flags
- template selection
- deployment toggles

## AIDLC Working Rules

Use AIDLC here as a practical anti-regression workflow for AI-assisted coding.

Admin work follows the same rules as ERP work. For `/admin`, the default validation stack is:

1. feature contract in `tests/client/featureContracts.ts`
2. mocked Playwright smoke for fast refactor loops
3. real admin smoke for integrated `/admin` verification
4. batch record in `docs/admin-aidlc/`

### Keep change units small

- Target edited files under 200 lines when practical.
- Treat 300+ line files as split candidates before adding more behavior.
- If a feature needs more space, split by responsibility rather than by arbitrary line count.

### Split by responsibility

Use narrow files with explicit ownership:

- route/page wrapper: parameter parsing and screen mounting only
- screen/container: orchestration and user flow
- hook/state: data fetching and derived state
- panel/component: isolated visual block
- provider/registry/config: industry or tenant-specific behavior

For service-style code, prefer `router -> service -> model/schema` boundaries.

### Use a hybrid split, not feature-only slicing

Do not split only by screen name or only by technical layer. Use both:

- user flow first: keep one file responsible for one visible workflow slice
- responsibility second: inside that flow, split into shell, controller, helper, section, and modal pieces

Good examples:

- `MobileInspectionSessionScreen` as the mobile route entry
- `use...Controller` for orchestration and derived state
- `...Step12` for one document step
- `...Modals` for overlay behavior owned by the same flow

This keeps files small without forcing the model to guess how distant pieces connect.

### Avoid context fragmentation

Small files only help if the interface between them is explicit.

When editing a feature, keep these artifacts in view together:

1. the feature contract in `tests/client/featureContracts.ts`
2. the screen or route being changed
3. the closest shared interface or helper file
4. this architecture document when ownership is unclear

## Contract Before Mutation

For ERP client work:

1. identify the affected feature contract
2. add or adjust smoke coverage
3. change code in the smallest responsible file
4. re-run the targeted smoke

If a behavior has no contract yet, treat it as unprotected until one exists.

For admin client work, treat the contract pack as the unit of change:

1. create or update the batch spec/record under `docs/admin-aidlc/`
2. add or adjust the admin feature contract
3. update mocked smoke
4. change code in the smallest responsible file
5. rerun mocked smoke, then real admin smoke when a local app is available

For control-center work, keep the batch record especially tight:

1. update the active `docs/admin-aidlc/batch-*.md` record
2. strengthen the `admin-control-center` contract when markers, export entry, or period filters move
3. rerun mocked control-center smoke
4. rerun real control-center smoke or record the exact blocker

## Skill Loading Strategy

Do not force-load every repo skill on every task. That adds context noise and makes the model
more likely to miss the active boundary.

Use a layered skill strategy instead:

1. `skills/aidlc-contract-pack/SKILL.md`
   This is the thin default guardrail for modularization, refactor, and regression-sensitive
   client work. It should be the broadest trigger.
2. `skills/admin-contract-pack/SKILL.md`
   Load this for `/admin` work that needs admin contracts, mocked smoke, real smoke, and
   admin audit updates.
3. `skills/erp-platform-guardrails/SKILL.md`
   Load this for ERP platform and worker/client flows outside `/admin`.

The rule of thumb is:

- broad bootstrap skill first
- one domain skill second
- optional references only when the task needs them

That gives us “nearly always loaded when relevant” behavior without paying the cost of always
loading every skill body.

## File Size Audit

Use the local AIDLC audit to spot oversized files in the ERP surface:

```bash
npm run aidlc:audit
```

Use strict mode only when you deliberately want the audit to fail on oversize files:

```bash
npm run aidlc:audit:strict
```

The audit is a guide, not permission to split files mechanically. Preserve clear ownership first.

Admin uses a separate scope so we can grow coverage without destabilizing the ERP baseline:

```bash
npm run aidlc:audit:admin
```

To make the workflow enforceable before commit, install the repo hook once:

```bash
npm run hooks:install
```

After that, `.githooks/pre-commit` runs:

```bash
npm run verify:aidlc
```

`verify:aidlc` checks staged file paths, requires matching contract-pack companions for guarded
admin/ERP source edits, and runs the matching AIDLC audit plus `tsc` before the commit is allowed.

`.githooks/pre-push` adds smoke enforcement for guarded source pushes:

```bash
npm run verify:aidlc:push
```

`verify:aidlc:push` looks at the files being pushed, resolves the required mocked smoke features,
checks that the local app is reachable at `PLAYWRIGHT_BASE_URL` (default `http://127.0.0.1:3211`),
and blocks the push if the smoke run fails or if a guarded surface has no smoke mapping yet.

For local clones, `npm install` / `npm ci` also runs the repo `prepare` script so the same
`.githooks` path is reinstalled automatically on each machine.

For remote enforcement, GitHub Actions reruns the AIDLC verification on pull requests and pushes to
`main`, including the push-equivalent mocked smoke path against a local app started inside CI. That
means missing local hooks no longer bypass the repo guardrails by accident.

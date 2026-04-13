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

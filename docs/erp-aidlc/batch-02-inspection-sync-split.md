# ERP AIDLC Batch 2: Inspection Session Sync Split

## Goal

Reduce the shared ERP inspection-session sync surface so `hooks/inspectionSessions/sync.ts`
stops owning auth bootstrap, master-data hydration, report loading, and local state application in
one file.

## Scope

- `hooks/inspectionSessions/sync.ts`
- `hooks/inspectionSessions/syncSupport.ts`
- `hooks/inspectionSessions/useInspectionSessionStateHydration.ts`
- `hooks/inspectionSessions/useInspectionSessionMasterDataSync.ts`
- `hooks/inspectionSessions/useInspectionSessionReportLoaders.ts`
- `hooks/inspectionSessions/useInspectionSessionAuthSync.ts`
- `components/auth/LoginPanel.tsx`
- `lib/auth/loginCredentialsStorage.ts`
- `tests/client/erp/auth.spec.ts`
- `tests/client/erp/mobile-link.spec.ts`
- `tests/client/featureContracts.ts`

## Contract Pack

### Feature contracts

- `auth`
- `mobile-link`

### Mocked smoke

- `tests/client/erp/auth.spec.ts`
- `tests/client/erp/mobile-link.spec.ts`

### Real smoke

- Not run in this batch unless local app credentials/seed are available.

## Validation Commands

```bash
npx eslint hooks/inspectionSessions/sync.ts \
  hooks/inspectionSessions/syncSupport.ts \
  hooks/inspectionSessions/useInspectionSessionStateHydration.ts \
  hooks/inspectionSessions/useInspectionSessionMasterDataSync.ts \
  hooks/inspectionSessions/useInspectionSessionReportLoaders.ts \
  hooks/inspectionSessions/useInspectionSessionAuthSync.ts \
  components/auth/LoginPanel.tsx \
  lib/auth/loginCredentialsStorage.ts \
  tests/client/erp/auth.spec.ts \
  tests/client/erp/mobile-link.spec.ts \
  tests/client/featureContracts.ts

npx tsc --noEmit --pretty false
npm run aidlc:audit
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3101 npm run test:client:smoke -- auth mobile-link
git diff --check
```

## Implementation Record

### Expected outputs

- `sync.ts` becomes a thin composition hook with explicit helper ownership.
- Auth bootstrap, master-data loading, and report/session loaders move behind narrower files.
- Shared login panels keep remembered-credential autofill but never auto-submit.

### Actual results

- Split the previous 1100+ line sync orchestrator into support, state hydration, master-data,
  report-loader, and auth/bootstrap modules while keeping the provider API stable.
- Reused `resetInspectionSyncRuntime()` to centralize ref-map clearing instead of repeating reset
  logic across login, logout, reload, and bootstrap paths.
- Stabilized the new `runtime` and action bundles with memoized identities so auth/bootstrap
  effects keep the original lifecycle instead of re-running on every render.
- Removed the shared login-panel auto-submit path and obsolete suppression storage helpers so
  desktop/mobile login waits for an explicit submit.
- Strengthened `auth` and `mobile-link` smoke checks to fail if `POST /auth/token` fires before a
  user-triggered login.

## Validation Run

- `npx eslint ...`
  - passed
- `npx tsc --noEmit --pretty false`
  - passed
- `npm run aidlc:audit`
  - passed with advisory warning: `tests/client/featureContracts.ts` is still 238 lines
- `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3101 npm run test:client:smoke -- auth mobile-link`
  - passed after rerunning against the current workspace app; an older dev server on `3100` was
    returning a 500 for `/mobile/sessions/report-tech-1` because its worktree environment was stale
- `git diff --check`
  - passed

## Residual Debt

- `tests/client/featureContracts.ts` is still above the preferred small-file target and is a good
  follow-up split candidate by ERP/admin contract family.
- `useInspectionSessionReportLoaders.ts` is smaller than the old monolith but still owns three
  fetch flows; if mobile/desktop report loading diverges further, a per-flow split may be worth it.

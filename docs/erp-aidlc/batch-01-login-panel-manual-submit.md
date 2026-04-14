# ERP AIDLC Batch 1: Login Panel Manual Submit

## Goal

Stop shared ERP/mobile login screens from auto-submitting saved credentials before the user presses
the login button.

## Scope

- `components/auth/LoginPanel.tsx`
- `lib/auth/loginCredentialsStorage.ts`
- `hooks/inspectionSessions/sync.ts`
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

## Implementation Record

### Expected outputs

- Remembered credentials may autofill the login form, but login submission must stay manual.
- Logout must return to a stable login panel without hidden re-login attempts.
- Mobile direct-link login must wait for a user-triggered submit.

### Actual results

- Removed the shared `LoginPanel` auto-submit effect.
- Kept remembered credentials autofill and updated the saved hint to tell the user to press the
  login button manually.
- Removed obsolete auto-login suppression storage/session plumbing from shared auth state.
- Strengthened `auth` and `mobile-link` mocked smoke to fail if `POST /auth/token` fires before a
  manual submit.

## Validation Commands

```bash
npx eslint components/auth/LoginPanel.tsx \
  lib/auth/loginCredentialsStorage.ts \
  hooks/inspectionSessions/sync.ts \
  tests/client/erp/auth.spec.ts \
  tests/client/erp/mobile-link.spec.ts \
  tests/client/featureContracts.ts

npx tsc --noEmit --pretty false
npm run aidlc:audit
npm run test:client:smoke -- auth mobile-link
git diff --check
```

## Validation Run

- `npx eslint ...`
  - passed
- `npx tsc --noEmit --pretty false`
  - passed
- `npm run aidlc:audit`
  - passed as advisory audit
- `npm run test:client:smoke -- auth mobile-link`
  - passed against local app
- `git diff --check`
  - passed

## Residual Debt

- `hooks/inspectionSessions/sync.ts` is still a large shared orchestration file and remains a good
  AIDLC split candidate around auth/session/reset responsibilities.
- `components/auth/LoginPanel.tsx` is still a shared platform component; if login variants keep
  diverging, a shell/controller split would reduce future regression risk.

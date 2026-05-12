# 06_QA_REGRESSION: Mailbox

## Role

너는 메일함 기능의 QA, 보안 검증, 시각 회귀 테스트를 수행하는 시니어 QA 엔지니어다.

## Goal

메일함 구현 후 build, route, OAuth, Gmail sync, UI, compose, security regression을 검증한다.

## Must Read

```text
docs/safety-features/mailbox/specs/validation.md
docs/safety-features/mailbox/specs/test_scenarios.md
docs/safety-features/mailbox/specs/known_issues.md
```

## Build Checks

```bash
rm -rf apps/web/.next
cd apps/web
npm run build
```

If backend test command exists, run it.

## Route Smoke

```text
/mailbox
/mail/connect/google?error=access_denied
/mail/connect/google?code=dummy&state=dummy
/mail/connect/naver
/mail/connect/naver-works
```

## Manual QA

### No Account

- no account onboarding appears
- Google connect CTA visible
- no stale success notice

### OAuth

- connect starts
- callback success creates account
- invalid state fails
- access_denied shows error
- real account email appears

### Sync

- sync button works
- initial sync imports threads
- failed sync does not clear existing list
- reconnect_required shown when token invalid

### Thread List

- folder filters work
- search works
- unread/star/attachment/time visible
- selected row state visible

### Viewer

- no selection empty state
- selected thread details
- attachments
- reply/forward/trash/archive

### Compose

- new mail
- reply
- forward
- draft save/restore
- attachments
- send success/failure

## Security QA

- attempt another account id
- attempt another thread id
- attempt another draft id
- verify tokens not returned
- verify logs do not include tokens

## Visual QA

Desktop:

- topbar/sidebar/list/viewer layout
- no permanent ERP sidebar
- no nested card layout

Mobile:

- drawer/stack behavior
- compose mobile panel

## Output Format

```md
# Mailbox QA Report

## Build Result

## Route Smoke Result

## Functional Result

## OAuth/Sync Result

## Security Result

## Visual Result

## Issues Found

## Recommended Fixes
```

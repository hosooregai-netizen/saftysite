# Mailbox QA After Hardening

## Build

```bash
rm -rf apps/web/.next
cd apps/web
npm run build
```

## Route smoke

- `/mailbox`
- `/mail/connect/google?error=access_denied`
- `/mail/connect/google?code=dummy&state=dummy`

## State QA

- [ ] 계정 없음 onboarding
- [ ] OAuth success pending refresh
- [ ] connected account + empty inbox
- [ ] search empty
- [ ] sync error
- [ ] reconnect required
- [ ] selected thread viewer
- [ ] compose new/reply/forward/draft

## Regression blockers

- OAuth success와 계정 없음 문구 동시 표시
- Gmail connect와 Workspace login CTA 혼동
- three-pane layout 붕괴
- compose panel 닫기/저장 중 데이터 손실

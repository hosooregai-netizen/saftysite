# QA Checklist

## Build

- [ ] `rm -rf apps/web/.next`
- [ ] `cd apps/web && npm run build`

## Account settings

- [ ] `/account` 진입
- [ ] session mode가 표시된다.
- [ ] Google Workspace 로그인 CTA가 보인다.
- [ ] 로그인 후 작업공간 이름이 보인다.
- [ ] Gmail 연결은 메일함으로 이동하도록 안내된다.
- [ ] Workspace 로그인 후 mailbox pending connect가 자동 발생하지 않는다.
- [ ] guest cache summary가 보인다.
- [ ] 임시 자료가 없으면 가져오기 버튼이 disabled 된다.
- [ ] 이미 현재 workspace로 import된 cache는 다시 가져오기 disabled 된다.
- [ ] 결제 패키지 버튼은 로그인 전 `/account?auth=required&intent=billing...`으로 이동한다.
- [ ] 로그인 후 결제 패키지 버튼은 `/billing/checkout`으로 이동한다.

## Regression

- [ ] `/mailbox`에서 Gmail 연결 CTA는 유지된다.
- [ ] `/auth/google/callback`과 `/mail/connect/google`이 혼동되지 않는다.

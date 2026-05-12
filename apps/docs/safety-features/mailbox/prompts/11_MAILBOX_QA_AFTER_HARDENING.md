# 11_MAILBOX_QA_AFTER_HARDENING

```text
너는 메일함 hardening 후 QA를 수행하는 시니어 QA 엔지니어다.

목표:
메일함 source recovery와 hardening 이후 build, route, state, compose, visual regression을 검증하라.

참조 문서:
- docs/safety-features/mailbox/specs/qa_after_hardening.md
- docs/safety-features/_quality/specs/visual_regression.md
- docs/safety-features/_quality/specs/oauth_regression.md

검증 명령:
rm -rf apps/web/.next
cd apps/web
npm run build

Route smoke:
- /mailbox
- /mail/connect/google?error=access_denied
- /mail/connect/google?code=dummy&state=dummy

검증 항목:
1. 계정 없음 onboarding
2. OAuth success pending refresh
3. connected account + empty inbox
4. search empty
5. sync error
6. selected thread viewer
7. compose new/reply/forward/draft

완료 기준:
- build 성공
- 상태 모순 없음
- three-pane layout 유지
- compose 주요 흐름 성공
```

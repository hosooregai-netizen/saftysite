# 07_QA_REGRESSION

```text
너는 auth-workspace QA를 담당하는 시니어 QA 엔지니어다.

목표:
인증, Google Workspace login, anonymous claim, guest import, workspace access를 회귀 테스트하라.

검증 명령:
rm -rf apps/web/.next
cd apps/web
npm run build

Route smoke:
- /account
- /auth/google/callback?error=access_denied
- /auth/google/callback?code=dummy&state=dummy

API smoke:
- POST /api/v1/auth/anonymous
- POST /api/v1/auth/login
- POST /api/v1/auth/google/start
- POST /api/v1/auth/google/complete
- POST /api/v1/auth/claim-anonymous
- GET /api/v1/auth/me
- GET /api/v1/workspaces/me
- POST /api/v1/workspaces/import-guest-cache

Negative tests:
- invalid token
- redirect_uri mismatch
- reused state
- wrong workspace id
- duplicate import

완료 기준:
- build 성공
- auth happy path 성공
- 핵심 negative test 성공
- docs/safety-features/auth-workspace/specs/test_scenarios.md 업데이트
```

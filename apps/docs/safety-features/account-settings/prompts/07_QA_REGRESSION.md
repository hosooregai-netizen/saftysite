# 07_QA_REGRESSION: Account Settings

```text
너는 계정/설정 기능 QA를 담당하는 시니어 QA 엔지니어다.

목표:
`/account`, `/auth/google/callback`, guest import, billing intent, session state를 검증하라.

참조 문서:
- docs/safety-features/account-settings/specs/test_scenarios.md
- docs/safety-features/account-settings/specs/validation.md
- docs/safety-features/account-settings/specs/known_issues.md

검증 명령:
rm -rf apps/web/.next
cd apps/web
npm run build

Route smoke:
- /account
- /account?auth=required&next=/reports/new
- /account?intent=billing&package=starter-10
- /account?authError=test
- /auth/google/callback?error=access_denied
- /auth/google/callback?code=dummy&state=dummy

Security:
- external nextPath 차단
- state 재사용 차단
- redirectUri mismatch 차단
- token/code 로그 노출 없음

완료 기준:
- build 성공
- route smoke 성공
- auth success/failure flow 검증
- guest import happy path/duplicate/failure 검증
- billing intent flow 검증
```

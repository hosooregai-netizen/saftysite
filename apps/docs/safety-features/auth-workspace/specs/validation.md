# Validation Spec: Auth Workspace

## Build validation

```bash
rm -rf apps/web/.next
cd apps/web
npm run build
```

## Route smoke

- `/account`
- `/auth/google/callback?error=access_denied`
- `/auth/google/callback?code=dummy&state=dummy`
- `/billing/checkout?package=starter-10` 로그인 필요 흐름

## Auth validation

- [ ] signup 성공
- [ ] duplicate signup 409
- [ ] login 성공
- [ ] invalid login 401
- [ ] anonymous auth 성공
- [ ] auth/me 성공
- [ ] Authorization 없음 차단

## Google auth validation

- [ ] start에서 authorization_url/state 반환
- [ ] invalid redirect_uri 차단
- [ ] complete에서 state 검증
- [ ] state 재사용 차단
- [ ] Google profile 기반 user 생성/조회
- [ ] callback error query 처리

## Workspace validation

- [ ] workspace/me 반환
- [ ] workspace seed 생성
- [ ] creditBalance 포함
- [ ] workspace 밖 데이터 접근 차단

## Claim/import validation

- [ ] anonymousToken claim 성공
- [ ] anonymous membership 제거
- [ ] authenticated membership 생성
- [ ] guest cache import counts 반환
- [ ] 중복 import 방지

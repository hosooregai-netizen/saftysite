# Validation Spec: Account Settings

## Build validation

```bash
rm -rf apps/web/.next
cd apps/web
npm run build
```

## Route smoke

- `/account`
- `/account?auth=required&next=/reports/new`
- `/account?intent=billing&package=starter-10`
- `/account?authError=test`
- `/auth/google/callback?error=access_denied`
- `/auth/google/callback?code=dummy&state=dummy`

## Functional validation

### Session

- [ ] local session 표시
- [ ] anonymous session 표시
- [ ] authenticated session 표시
- [ ] session 변경 시 UI 갱신

### Google auth

- [ ] start endpoint 호출
- [ ] state context 저장
- [ ] callback code/state 누락 처리
- [ ] provider error 처리
- [ ] callback 성공 후 nextPath 이동
- [ ] state 재사용 차단

### Guest import

- [ ] guest cache 없음 상태
- [ ] guest cache 있음 상태
- [ ] import 성공
- [ ] import 실패 후 재시도
- [ ] 중복 import skip

### Billing

- [ ] 미로그인 패키지 선택 → account intent
- [ ] 로그인 후 checkout 이동
- [ ] billingNotice 표시
- [ ] billingError 표시

## Security validation

- [ ] redirectUri allowlist 검증
- [ ] nextPath는 내부 경로만 허용
- [ ] OAuth code/token 로그 금지
- [ ] anonymous token claim 후 제거
- [ ] guest cache import는 현재 workspace로만 수행

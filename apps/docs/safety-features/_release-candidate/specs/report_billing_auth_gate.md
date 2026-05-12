# Report / Billing / Auth Gate

## Report gate

- `/reports/new` guided upload route가 build-safe해야 한다.
- `/reports/[reportId]` review workspace가 local/generated snapshot을 처리해야 한다.
- review complete 전 export는 막혀야 한다.

## Billing gate

- 최초 final export 1회 credit 차감 정책 유지
- Toss webhook idempotency 유지
- `/billing/success`, `/billing/fail` route smoke 통과

## Auth gate

- Workspace Google login과 Gmail connect 분리
- anonymous/local/authenticated session mode 분리
- guest import 중복 방지

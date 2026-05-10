# Release Candidate Gate

## RC 진입 조건

- clean build 성공
- source readiness missing import 없음
- P0 route smoke 통과
- workspace access negative test 통과
- webhard public share boundary 통과
- mailbox OAuth error state 통과
- report export billing gate 통과

## RC 보류 조건

- build 실패
- workspace/public share 보안 실패
- billing idempotency 실패
- 메일함 연결 상태가 모순됨
- 웹하드가 ERP 카드형으로 회귀함

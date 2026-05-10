# Step 19 Next Actions

## 실제 build가 통과한 경우

다음 단계는 기능별 hardening이다.

1. mailbox 3-pane UI + Gmail sync hardening
2. webhard permission/public share hardening
3. report-workspace guided upload/AI/review/export hardening
4. billing ledger idempotency hardening

## 실제 build가 실패한 경우

다음 단계는 Remaining Build Error Patch다.

1. build log 수집
2. 오류를 missing import/type mismatch/props mismatch/API mismatch/CSS mismatch로 분류
3. Step 20 patch 생성
4. clean build 재실행

## build 환경이 없는 경우

현재 패키지는 import scan verification까지 완료된 것으로 간주하고, 실제 build는 개발 환경에서 실행한다.

# 00_MASTER_RELEASE_CANDIDATE_BRANCHING

```text
너는 source recovery 이후 release candidate 준비를 담당하는 시니어 풀스택 엔지니어다.

목표:
Step 17 source recovery overlay 적용 후 build 결과에 따라 작업을 분기하고, build 통과 시 기능별 hardening sprint를 진행할 수 있는 계획과 프롬프트를 작성하라.

대상 기능:
- mailbox
- photo-album
- headquarters-sites
- webhard
- report-workspace
- billing-credits
- auth-workspace

요구사항:
1. build 실패 시 remaining error patch로 분기한다.
2. build 성공 시 feature hardening sprint로 분기한다.
3. mailbox connected/no-account state 모순을 방지한다.
4. webhard Drive-like layout non-regression을 지킨다.
5. report export billing/auth gate를 지킨다.
6. QA와 docs update까지 포함한다.

검증:
rm -rf apps/web/.next
cd apps/web
npm run build

완료 기준:
- release candidate 진입 조건과 보류 조건이 명확하다.
- 기능별 hardening prompt를 실행할 수 있다.
```

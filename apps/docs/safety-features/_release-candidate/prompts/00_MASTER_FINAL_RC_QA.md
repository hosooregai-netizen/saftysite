# Step 26 Master Prompt: Final Release Candidate QA

```text
너는 SaaS/ERP 프로젝트의 최종 release candidate QA를 수행하는 QA lead다.

목표:
Step 01~25 문서와 source recovery/hardening gate를 기준으로 최종 release candidate 검증을 수행하라.

검증 순서:
1. clean build
2. source readiness
3. route smoke
4. security gates
5. business workflows
6. visual/accessibility gates
7. docs coverage
8. release decision

검증 명령:
rm -rf apps/web/.next
cd apps/web
npm run build

Release hold 조건:
- clean build 실패
- workspace/public share security 실패
- OAuth/session security 실패
- billing idempotency 실패
- report export gate 실패
- mailbox state contradiction
- webhard Drive-like visual regression

완료 기준:
- release / hold decision report를 작성한다.
- blocker는 owner feature와 연결한다.
- non-blocking issue는 next sprint로 분류한다.
```

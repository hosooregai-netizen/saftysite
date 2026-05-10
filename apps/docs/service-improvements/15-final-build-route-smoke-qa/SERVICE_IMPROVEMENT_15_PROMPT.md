# Service Improvement 15 Prompt: Final Clean Build / Route Smoke QA

```text
너는 누적 service improvement 01~14를 적용한 release candidate를 검증하는 QA lead다.

목표:
clean build, backend compile, route smoke, 기능별 regression gate를 실행하고 release / hold 판단에 필요한 QA report를 작성하라.

전제:
- service_improvements_01_to_14_apply_overlay.zip이 적용되어 있다.
- 이번 15단계 QA overlay가 적용되어 있다.

실행:
bash scripts/service-improvements/run-final-qa.sh

수동 실행:
rm -rf apps/web/.next
cd apps/web
npm run build

cd ../api
python -m compileall app

중점:
1. 메일함 상태 모순이 없는지 확인하라.
2. 웹하드가 Drive-like layout을 유지하는지 확인하라.
3. public share root boundary가 지켜지는지 확인하라.
4. 보고서 export gate가 지켜지는지 확인하라.
5. billing idempotency와 credit 정책을 확인하라.
6. Workspace Google login과 Gmail connect가 분리되어 있는지 확인하라.
7. guest import 중복이 없는지 확인하라.
8. 사진첩/사업장/보고서 route 간 이동이 자연스러운지 확인하라.

산출물:
- docs/service-improvements/15-final-build-route-smoke-qa/FINAL_QA_REPORT.md

완료 기준:
- build result
- route smoke result
- blocker list
- release / hold / conditional decision
```

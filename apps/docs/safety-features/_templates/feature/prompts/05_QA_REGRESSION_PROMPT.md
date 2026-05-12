# Prompt: QA and Regression

```text
너는 기능 QA와 regression test를 담당하는 시니어 QA 엔지니어다.

목표:
<FEATURE_NAME> 기능이 specs/validation.md와 test_scenarios.md 기준을 만족하는지 검증하라.

먼저 읽을 문서:
- docs/safety-features/<FEATURE_SLUG>/specs/validation.md
- docs/safety-features/<FEATURE_SLUG>/specs/test_scenarios.md
- docs/safety-features/<FEATURE_SLUG>/specs/reverse_map.md

검증 항목:
1. route smoke test
2. 주요 user flow
3. loading/empty/error state
4. auth/workspace boundary
5. responsive layout
6. related feature regression
7. build/type check

권장 명령:
```bash
rm -rf apps/web/.next
cd apps/web
npm run build
```

산출물:
- pass/fail checklist
- critical issue list
- recommended fix order
```

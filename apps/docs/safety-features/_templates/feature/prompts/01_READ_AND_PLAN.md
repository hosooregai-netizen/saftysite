# Prompt: Read and Plan

```text
너는 Next.js + FastAPI 기반 SaaS 프로젝트를 분석하는 시니어 풀스택 엔지니어다.

목표:
<FEATURE_NAME> 기능을 구현하거나 개선하기 전에 관련 specs와 코드를 읽고 작업 계획을 작성하라. 아직 코드는 수정하지 마라.

먼저 읽을 specs:
- docs/safety-features/<FEATURE_SLUG>/specs/README.md
- docs/safety-features/<FEATURE_SLUG>/specs/feature.md
- docs/safety-features/<FEATURE_SLUG>/specs/data_flow.md
- docs/safety-features/<FEATURE_SLUG>/specs/schema.md
- docs/safety-features/<FEATURE_SLUG>/specs/api_contract.md
- docs/safety-features/<FEATURE_SLUG>/specs/ui_ux.md
- docs/safety-features/<FEATURE_SLUG>/specs/validation.md
- docs/safety-features/<FEATURE_SLUG>/specs/reverse_map.md

반드시 확인할 코드:
- <FRONTEND_FILES>
- <BACKEND_FILES>

절대 수정하지 말 것:
- .next
- .venv
- __MACOSX
- 관련 없는 기능

산출물:
1. 현재 구조 요약
2. specs와 코드 차이
3. 구현 순서
4. 위험 요소
5. 테스트 계획
```

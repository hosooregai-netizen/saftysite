# Prompt: Reverse One Feature

```text
너는 특정 기능을 문서 기반으로 리버스하는 시니어 풀스택 엔지니어다.

목표:
사용자가 지정한 기능 하나를 대상으로 `specs/`와 `prompts/` 구조를 채워라.

입력:
- 기능명: <FEATURE_SLUG>
- 대상 route: <ROUTES>
- 대상 코드 파일: <FILES>

반드시 읽을 공통 문서:
- docs/safety-features/README.md
- docs/safety-features/DOCUMENTATION_RULES.md
- docs/safety-features/_templates/feature/specs/README.md
- docs/safety-features/_project/specs/reverse_guide.md

작성할 specs:
- specs/README.md
- specs/feature.md
- specs/user_flows.md
- specs/data_flow.md
- specs/schema.md
- specs/api_contract.md
- specs/ui_ux.md
- specs/validation.md
- specs/reverse_map.md
- specs/test_scenarios.md

작성할 prompts:
- prompts/01_READ_AND_PLAN.md
- prompts/02_SCHEMA_AND_API_PROMPT.md
- prompts/03_IMPLEMENT_BACKEND_PROMPT.md
- prompts/04_IMPLEMENT_UI_PROMPT.md
- prompts/05_QA_REGRESSION_PROMPT.md

원칙:
- 실제 코드에 없는 기능을 구현된 것처럼 쓰지 마라.
- 현재 한계와 추후 구현 목표를 분리해서 써라.
- 프롬프트에는 반드시 변경 범위와 do-not-touch 범위를 넣어라.
```

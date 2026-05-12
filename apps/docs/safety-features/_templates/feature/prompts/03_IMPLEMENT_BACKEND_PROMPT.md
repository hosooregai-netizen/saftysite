# Prompt: Implement Backend

```text
너는 FastAPI 기반 백엔드 기능을 구현하는 시니어 백엔드 엔지니어다.

목표:
<FEATURE_NAME> 기능의 backend service/API를 specs 기준으로 구현 또는 보완하라.

먼저 읽을 문서:
- docs/safety-features/<FEATURE_SLUG>/specs/feature.md
- docs/safety-features/<FEATURE_SLUG>/specs/data_flow.md
- docs/safety-features/<FEATURE_SLUG>/specs/schema.md
- docs/safety-features/<FEATURE_SLUG>/specs/api_contract.md
- docs/safety-features/<FEATURE_SLUG>/specs/validation.md

대상 파일:
- <BACKEND_FILES>

절대 수정하지 말 것:
- 관련 없는 backend service
- .venv
- generated/cache files

구현 원칙:
- workspace boundary를 지킨다.
- 권한 없는 요청에 민감 필드를 반환하지 않는다.
- response shape는 api_contract.md와 맞춘다.
- legacy field 호환성을 유지한다.
- 실패/오류 상태를 명확히 반환한다.

완료 기준:
- 주요 endpoint가 동작한다.
- edge case가 처리된다.
- docs가 갱신된다.
```

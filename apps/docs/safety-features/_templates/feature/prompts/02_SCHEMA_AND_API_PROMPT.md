# Prompt: Schema and API

```text
너는 데이터 모델과 API 계약을 정리하는 시니어 백엔드 엔지니어다.

목표:
<FEATURE_NAME> 기능의 schema와 API contract를 specs 기준으로 정리하고, 필요한 경우 구현을 보완하라.

먼저 읽을 문서:
- docs/safety-features/<FEATURE_SLUG>/specs/schema.md
- docs/safety-features/<FEATURE_SLUG>/specs/api_contract.md
- docs/safety-features/<FEATURE_SLUG>/specs/data_flow.md
- docs/safety-features/<FEATURE_SLUG>/specs/validation.md

요구사항:
1. backend model과 frontend type의 naming 차이를 정리한다.
2. request/response shape를 안정화한다.
3. legacy field가 있으면 호환성을 유지한다.
4. auth/workspace boundary를 확인한다.
5. API 변경 시 docs를 갱신한다.

완료 기준:
- schema.md와 api_contract.md가 실제 코드와 일치한다.
- API response가 frontend에서 안정적으로 normalize된다.
- 관련 regression test가 정의되어 있다.
```

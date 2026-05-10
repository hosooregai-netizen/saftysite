# 02_SCHEMA_AND_API_PROMPT

```text
너는 auth-workspace의 schema와 API 계약을 안정화하는 시니어 아키텍트다.

목표:
User, Workspace, Membership, DemoSession, AuthResponse, GuestWorkspaceCache, ImportGuestWorkspaceCacheRequest/Response의 계약을 최신 코드 기준으로 정리하라.

대상 문서:
- docs/safety-features/auth-workspace/specs/schema.md
- docs/safety-features/auth-workspace/specs/api_contract.md
- docs/safety-features/auth-workspace/specs/data_flow.md
- docs/safety-features/auth-workspace/specs/reverse_map.md

요구사항:
1. frontend type과 backend model의 필드 차이를 정리하라.
2. snake_case/camelCase 변환 필요 여부를 확인하라.
3. session mode별 필수 필드를 정의하라.
4. API error status를 명확히 하라.
5. 문서와 코드가 불일치하면 문서를 업데이트하라.

완료 기준:
- schema/api 문서만 보고 auth-workspace API를 구현할 수 있다.
```

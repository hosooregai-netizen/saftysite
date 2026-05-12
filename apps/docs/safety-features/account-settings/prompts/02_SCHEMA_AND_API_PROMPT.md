# 02_SCHEMA_AND_API_PROMPT

```text
너는 account-settings의 schema/API 계약을 정리하는 시니어 아키텍트다.

목표:
DemoSession, AuthResponse, Workspace, Membership, Google auth context, GuestWorkspaceCache, billing intent의 타입과 API 계약을 최신 코드 기준으로 정리하라.

참조 문서:
- docs/safety-features/account-settings/specs/schema.md
- docs/safety-features/account-settings/specs/api_contract.md
- docs/safety-features/account-settings/specs/session_state.md

대상 코드:
- apps/web/lib/reportApi.ts
- apps/web/lib/sessionAuthFlow.ts
- apps/web/lib/guestWorkspaceCache.ts
- apps/web/lib/workspaceStorageApi.ts
- apps/api/app/main.py
- apps/api/app/models.py

요구사항:
1. frontend session type과 backend AuthResponse가 일치하는지 확인하라.
2. Google auth start/complete request/response를 명확히 하라.
3. guest import request/response type을 정리하라.
4. billing intent query param 우선순위를 정리하라.
5. snake_case/camelCase 변환이 필요한 필드를 찾으라.
6. 문서와 코드가 다르면 문서를 업데이트하라.

완료 기준:
- schema.md와 api_contract.md만 보고 account-settings 흐름을 구현할 수 있다.
```

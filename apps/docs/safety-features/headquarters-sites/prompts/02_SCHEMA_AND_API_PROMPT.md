# 02_SCHEMA_AND_API_PROMPT

```text
너는 Next.js + FastAPI 기반 기술지도 ERP의 사업장/현장 기준정보 기능을 담당하는 시니어 풀스택 엔지니어다.

목표:
SafetyHeadquarter, SafetySite, SafetyAssignment, SafetyHeadquarterAssignment의 schema와 API contract를 최신 코드 기준으로 정리하고 필요한 타입/source 파일을 보강하라.

참조 문서:
- docs/safety-features/headquarters-sites/specs/schema.md
- docs/safety-features/headquarters-sites/specs/api_contract.md

대상 코드:
- apps/web/types/backend.ts
- apps/web/types/controller.ts
- apps/web/lib/safetyApi/adminEndpoints.ts
- apps/api/app/models.py
- apps/api/app/main.py
- apps/api/app/apps_stack.py

요구사항:
1. frontend 타입과 backend 모델 필드를 맞춰라.
2. API request/response 타입을 명확히 하라.
3. workspace_id는 client 입력이 아니라 server context로 결정하라.
4. site 생성 시 headquarter_id 검증을 보장하라.
5. assignment 생성 시 user/site/headquarter workspace 일치를 검증하라.
6. snake_case/camelCase 변환 정책을 문서화하라.

완료 기준:
- clean build에 필요한 타입이 source tree에 존재한다.
- api_contract.md와 실제 API client가 일치한다.
```

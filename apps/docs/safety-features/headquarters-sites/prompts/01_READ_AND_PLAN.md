# 01_READ_AND_PLAN: Headquarters & Sites

```text
너는 Next.js + FastAPI 기반 기술지도 ERP의 사업장/현장 기준정보 기능을 담당하는 시니어 풀스택 엔지니어다.

목표:
사업장/현장 기능의 현재 코드, API, 타입, 누락 source 가능성을 분석하고 구현 계획을 세워라. 아직 코드를 수정하지 마라.

반드시 확인할 문서:
- docs/safety-features/headquarters-sites/specs/feature.md
- docs/safety-features/headquarters-sites/specs/schema.md
- docs/safety-features/headquarters-sites/specs/api_contract.md
- docs/safety-features/headquarters-sites/specs/source_readiness.md
- docs/safety-features/headquarters-sites/specs/reverse_map.md

반드시 확인할 코드:
- apps/web/app/headquarters/page.tsx
- apps/web/app/sites/page.tsx
- apps/web/components/HeadquartersHubScreen.tsx
- apps/web/components/SitesHubScreen.tsx
- apps/web/lib/safetyApi.ts
- apps/web/lib/safetyApi/adminEndpoints.ts
- apps/web/types/backend.ts
- apps/web/types/controller.ts
- apps/api/app/main.py
- apps/api/app/apps_stack.py
- apps/api/app/models.py

절대 수정하지 말 것:
- .next
- .venv
- __MACOSX
- 웹하드/메일함/보고서 코드

산출물:
1. route/component/API map
2. source readiness 위험
3. schema/API 차이
4. 구현 우선순위
5. QA 계획
```

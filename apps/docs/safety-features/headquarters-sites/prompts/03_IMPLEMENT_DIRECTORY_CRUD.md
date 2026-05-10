# 03_IMPLEMENT_DIRECTORY_CRUD

```text
너는 Next.js + FastAPI 기반 기술지도 ERP의 사업장/현장 기준정보 기능을 담당하는 시니어 풀스택 엔지니어다.

목표:
사업장/현장 CRUD를 안정화하라.

참조 문서:
- docs/safety-features/headquarters-sites/specs/feature.md
- docs/safety-features/headquarters-sites/specs/validation.md
- docs/safety-features/headquarters-sites/specs/directory_usage.md

대상 코드:
- apps/web/components/HeadquartersHubScreen.tsx
- apps/web/features/admin/sections/headquarters/*
- apps/web/features/admin/sections/sites/*
- apps/web/lib/safetyApi/adminEndpoints.ts
- apps/api/app/main.py
- apps/api/app/apps_stack.py

요구사항:
1. 사업장 생성/수정/비활성화가 동작해야 한다.
2. 현장 생성/수정/비활성화가 동작해야 한다.
3. 성공 후 목록과 선택 상태를 갱신하라.
4. 검색/정렬 상태가 깨지지 않게 하라.
5. `/reports/new`에서 신규 생성한 site가 즉시 선택 가능해야 한다.
6. hard delete보다 deactivate를 우선하라.

완료 기준:
- 사업장/현장 CRUD happy path 통과
- workspace 밖 데이터 접근 차단
- 보고서 작성 연계 통과
```

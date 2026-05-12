# 04_IMPLEMENT_ASSIGNMENT

```text
너는 Next.js + FastAPI 기반 기술지도 ERP의 사업장/현장 기준정보 기능을 담당하는 시니어 풀스택 엔지니어다.

목표:
사용자별 사업장/현장 배정 기능을 구현 또는 검증하라.

참조 문서:
- docs/safety-features/headquarters-sites/specs/assignment.md
- docs/safety-features/headquarters-sites/specs/api_contract.md

대상 코드:
- apps/web/components/HeadquartersHubScreen.tsx
- apps/web/features/admin/sections/headquarters/*
- apps/web/features/admin/sections/sites/*
- apps/web/lib/safetyApi/adminEndpoints.ts
- apps/api/app/main.py
- apps/api/app/apps_stack.py

요구사항:
1. 사용자 목록을 조회할 수 있어야 한다.
2. site assignment 생성/해제가 동작해야 한다.
3. headquarter assignment 생성/해제가 동작해야 한다.
4. 중복 active assignment를 막아라.
5. `/headquarters?scope=assigned`에서는 배정된 데이터만 보여라.
6. 관리자와 일반 사용자의 접근 범위를 구분하라.

완료 기준:
- assignment CRUD 통과
- assigned scope 필터 통과
- workspace 격리 통과
```

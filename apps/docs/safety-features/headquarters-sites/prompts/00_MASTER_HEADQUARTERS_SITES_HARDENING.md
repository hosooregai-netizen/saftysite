# Step 23 Master Prompt: Headquarters/Sites Hardening

```text
너는 Next.js + FastAPI 기반 ERP 기준정보 관리 기능을 고도화하는 시니어 풀스택 엔지니어다.

목표:
Step 17 source recovery 이후 `headquarters-sites` 기능을 사업장/현장 CRUD, assignment, filter/sort/pagination, guest/auth mode, linked navigation까지 실제 업무 수준으로 고도화하라.

핵심 대상:
- apps/web/components/HeadquartersHubScreen.tsx
- apps/web/components/SitesHubScreen.tsx
- apps/web/lib/safetyApi.ts
- apps/web/lib/safetyApi/adminEndpoints.ts
- apps/web/lib/admin/apiClient.ts
- apps/web/types/backend.ts
- apps/web/types/controller.ts
- apps/web/features/admin/sections/**

요구사항:
1. 사업장/현장 CRUD를 안정화한다.
2. guest mode와 authenticated mode를 분리한다.
3. assignment/access scope를 명확히 한다.
4. 검색/필터/정렬/pagination을 구현 또는 개선한다.
5. modal form validation을 강화한다.
6. 보고서 작성, 보고서 목록, 사진첩, 메일함으로 연결되는 quick action을 정리한다.
7. ERP AppShell 기준정보 관리 패턴을 유지한다.
8. 웹하드/메일함/보고서 AI pipeline은 수정하지 않는다.

검증:
rm -rf apps/web/.next
cd apps/web
npm run build

완료 기준:
- /headquarters, /sites route smoke 통과
- guest/auth mode state가 명확함
- CRUD/assignment/filter/linking QA 기준 충족
```

# 05_SOURCE_READINESS

```text
너는 Next.js + FastAPI 기반 기술지도 ERP의 사업장/현장 기준정보 기능을 담당하는 시니어 풀스택 엔지니어다.

목표:
사업장/현장 기능의 clean build를 막는 누락 source file을 확인하고 복구하라.

참조 문서:
- docs/safety-features/headquarters-sites/specs/source_readiness.md
- docs/safety-features/headquarters-sites/specs/code_inventory.md

검증 명령:
rm -rf apps/web/.next
cd apps/web
npm run build

반드시 확인할 파일:
- apps/web/lib/safetyApi/adminEndpoints.ts
- apps/web/types/backend.ts
- apps/web/types/controller.ts
- apps/web/types/admin.ts
- apps/web/features/admin/sections/headquarters/*
- apps/web/features/admin/sections/sites/*
- apps/web/lib/admin.ts
- apps/web/lib/admin/apiClient.ts
- apps/web/lib/appsSafetySession.ts
- apps/web/features/home/lib/siteEntry.ts

요구사항:
1. .next 캐시에 의존하지 마라.
2. 누락 import를 source file로 복구하라.
3. 우선 UI 변경보다 build 안정화를 우선하라.
4. 타입은 schema.md 기준으로 작성하라.
5. API client는 api_contract.md 기준으로 작성하라.

완료 기준:
- .next 삭제 후 npm run build 성공
- /headquarters route smoke 통과
- /sites redirect smoke 통과
```

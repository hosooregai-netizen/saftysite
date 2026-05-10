# Source Readiness Spec

## 목적

최신 압축본 기준으로 `/headquarters` 관련 컴포넌트가 여러 source 파일을 import한다. 이 파일들이 실제 source tree에 없고 `.next` 캐시에만 있으면 clean build에서 실패할 수 있다.

## 반드시 확인할 source files

```text
apps/web/lib/safetyApi/adminEndpoints.ts
apps/web/types/backend.ts
apps/web/types/controller.ts
apps/web/types/admin.ts
apps/web/features/admin/sections/AdminSectionShared.module.css
apps/web/features/admin/sections/headquarters/HeadquarterEditorModal.tsx
apps/web/features/admin/sections/headquarters/HeadquarterSummaryPanel.tsx
apps/web/features/admin/sections/headquarters/HeadquartersSection.tsx
apps/web/features/admin/sections/headquarters/HeadquartersTable.tsx
apps/web/features/admin/sections/headquarters/useHeadquartersSectionState.ts
apps/web/features/admin/sections/headquarters/SiteManagementMainPanel.tsx
apps/web/features/admin/sections/sites/SiteEditorModal.tsx
apps/web/features/admin/sections/sites/SitesFilterMenu.tsx
apps/web/features/admin/sections/sites/SitesTable.tsx
apps/web/features/admin/sections/sites/siteSectionHelpers.ts
apps/web/lib/admin.ts
apps/web/lib/admin/apiClient.ts
apps/web/lib/appsSafetySession.ts
apps/web/features/home/lib/siteEntry.ts
```

## clean build 기준

```bash
rm -rf apps/web/.next
cd apps/web
npm run build
```

## 복구 원칙

- `.next` 캐시에서 코드를 복사하는 방식에 의존하지 않는다.
- 누락 파일은 현재 import 계약에 맞는 최소 source file로 복구한다.
- 타입은 `schema.md`와 `api_contract.md`를 기준으로 작성한다.
- 기존 UI 동작을 깨지 않도록 먼저 build만 복구하고, UI polish는 별도 단계로 진행한다.

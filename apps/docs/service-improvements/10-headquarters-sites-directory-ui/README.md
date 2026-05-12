# Service Improvement 10: Headquarters/Sites Directory UI Hardening

## 목적

사업장/현장 기준정보 화면을 실제 ERP 디렉터리 관리 화면으로 고도화한다.

현재 메뉴에서도 `사업장/현장`은 ERP 기준정보 관리 기능으로 분류되어 있고, 보고서 작성·사진첩·메일함의 기준 데이터 역할을 한다.

## 적용 파일

```text
apps/web/features/admin/sections/AdminSectionShared.module.css
apps/web/features/admin/sections/headquarters/HeadquarterEditorModal.tsx
apps/web/features/admin/sections/headquarters/HeadquarterSummaryPanel.tsx
apps/web/features/admin/sections/headquarters/HeadquartersSection.tsx
apps/web/features/admin/sections/headquarters/HeadquartersTable.tsx
apps/web/features/admin/sections/headquarters/SiteManagementMainPanel.tsx
apps/web/features/admin/sections/headquarters/useHeadquartersSectionState.ts
apps/web/features/admin/sections/sites/SiteEditorModal.tsx
apps/web/features/admin/sections/sites/SitesFilterMenu.tsx
apps/web/features/admin/sections/sites/SitesTable.tsx
apps/web/features/admin/sections/sites/siteSectionHelpers.ts
```

## 핵심 개선

- 사업장 목록 table UI 개선
- 현장 목록 table UI 개선
- 사업장/현장 form validation 보강
- 상태/배정 filter chip UI 추가
- 사업장 summary panel 추가
- 현장 detail quick action 추가
- 보고서 작성, 보고서 이력, 사진첩, 메일함으로 이동하는 링크 제공

## 적용

```bash
unzip service_improvement_10_headquarters_sites_directory_ui_overlay.zip
rm -rf apps/web/.next
cd apps/web
npm run build
```

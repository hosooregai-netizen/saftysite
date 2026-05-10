# Service Improvement 10 Prompt: Headquarters/Sites Directory UI Hardening

```text
너는 ERP 기준정보 관리 화면을 구현하는 시니어 프론트엔드 엔지니어다.

목표:
사업장/현장 기준정보 화면을 보고서 작성, 사진첩, 메일함의 기준 데이터 허브로 고도화하라.

대상 파일:
- apps/web/components/HeadquartersHubScreen.tsx
- apps/web/components/SitesHubScreen.tsx
- apps/web/features/admin/sections/headquarters/*
- apps/web/features/admin/sections/sites/*
- apps/web/features/admin/sections/AdminSectionShared.module.css

요구사항:
1. 사업장 목록 table에 사업장명, 번호, 담당자, 상태, 작업을 표시하라.
2. 현장 목록 table에 현장명, 사업장, 담당자, 최근 지도일, 상태, 작업을 표시하라.
3. 사업장/현장 modal form validation을 강화하라.
4. 진행/완료/배정됨/미배정 filter chip을 제공하라.
5. 현장 상세에서 새 보고서 작성, 보고서 이력, 사진첩, 메일함 quick action을 제공하라.
6. guest mode와 authenticated mode의 CTA가 혼동되지 않게 하라.
7. ERP AppShell 기준정보 화면을 유지하라.
8. 웹하드 Drive-like layout이나 메일함 three-pane layout로 바꾸지 마라.

검증:
rm -rf apps/web/.next
cd apps/web
npm run build

완료 기준:
- /headquarters route smoke 통과
- /sites route smoke 통과
- 사업장/현장 목록과 modal이 동작
- linked feature navigation이 동작
```

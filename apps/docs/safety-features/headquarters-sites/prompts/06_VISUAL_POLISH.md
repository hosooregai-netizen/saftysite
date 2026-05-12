# 06_VISUAL_POLISH

```text
너는 Next.js + FastAPI 기반 기술지도 ERP의 사업장/현장 기준정보 기능을 담당하는 시니어 풀스택 엔지니어다.

목표:
사업장/현장 기준정보 화면을 ERP AppShell에 맞게 사용성 좋게 정리하라.

참조 문서:
- docs/safety-features/headquarters-sites/specs/ui_ux.md
- docs/safety-features/_design-system/specs/layout_patterns.md

대상 코드:
- apps/web/components/HeadquartersHubScreen.tsx
- apps/web/components/SitesHubScreen.tsx
- apps/web/features/admin/sections/headquarters/*
- apps/web/features/admin/sections/sites/*

요구사항:
1. 사업장 목록, 현장 목록, 상세/summary panel을 명확히 구분하라.
2. 검색/정렬/필터 toolbar를 정돈하라.
3. 생성/수정 modal의 form label과 validation을 개선하라.
4. 로그인 필요, empty, loading, error state를 명확히 하라.
5. 보고서 작성, 사진첩 열기, 배정 관리 action을 잘 드러내라.
6. 웹하드/메일함처럼 full-screen shell로 바꾸지 마라. 이 기능은 ERP AppShell 패턴을 유지한다.

완료 기준:
- 사업장/현장 관리 화면이 ERP 기준정보 관리 화면처럼 보인다.
- table row와 modal 접근성이 개선된다.
- 기존 보고서/사진첩 연계가 깨지지 않는다.
```

# 14_DESIGN_IMPLEMENTATION_PROMPT: Headquarters/Sites Directory Design Implementation

```text
너는 ERP directory management 디자인 구현을 담당하는 시니어 프론트엔드 엔지니어다.

목표:
사업장/현장 기준정보를 ERP 관리 화면답게 검색, 필터, table, modal, quick actions 중심으로 정리한다.

대상 route:
- /headquarters
- /sites

대상 파일:
- apps/web/components/HeadquartersHubScreen.tsx
- apps/web/components/SitesHubScreen.tsx
- apps/web/features/admin/sections/headquarters/*
- apps/web/features/admin/sections/sites/*
- apps/web/features/admin/sections/AdminSectionShared.module.css

반드시 먼저 읽을 문서:
- docs/safety-features/_design-system/specs/README.md
- docs/safety-features/_design-implementation/specs/GLOBAL_DESIGN_IMPLEMENTATION_RULES.md
- docs/safety-features/headquarters-sites/specs/ui_ux.md
- docs/safety-features/headquarters-sites/specs/validation.md
- docs/safety-features/headquarters-sites/specs/known_issues.md

구현 요구사항:
1. 사업장 목록은 사업장명, 주소, 사업개시번호, 담당자, 상태, 작업을 표시한다.
2. 현장 목록은 현장명, 사업장명, 주소, 담당자, 최근 지도일, 상태, 작업을 표시한다.
3. modal form은 필수 입력, 저장 가능 여부, 오류 메시지를 명확히 표시한다.
4. 현장 detail에는 새 보고서, 보고서 이력, 사진첩, 메일함 quick action을 제공한다.
5. guest/auth mode 차이를 badge와 CTA로 표시한다.

Non-regression:
- 기준정보 화면을 fullscreen workspace로 바꾸지 말 것
- 사업장/현장 연결 없는 quick action 생성 금지

공통 디자인 기준:
1. loading / empty / error / auth-required / permission-denied 상태를 분리하라.
2. primary CTA와 secondary CTA의 위계를 명확히 하라.
3. disabled 상태에는 이유를 보여라.
4. icon-only button에는 aria-label을 추가하라.
5. table/list row는 keyboard focus가 가능해야 한다.
6. modal/dialog는 Escape 닫기 또는 명확한 닫기 버튼을 제공해야 한다.
7. mobile에서는 주요 작업이 사라지지 않게 stack/drawer 구조를 제공하라.
8. 기존 feature의 data flow와 API contract를 변경하지 말고, 필요한 경우 별도 구현 프롬프트로 분리하라.

검증:
rm -rf apps/web/.next
cd apps/web
npm run build

Visual QA:
- 대상 route가 지정된 layout pattern으로 보이는지 확인한다.
- empty/error/loading 상태를 각각 확인한다.
- mobile width에서 주요 CTA가 보이는지 확인한다.
- 기능별 non-regression 항목을 확인한다.

완료 기준:
- 대상 route visual QA 통과
- 기능별 non-regression 통과
- build 통과
- 변경된 UI 기준을 specs/ui_ux.md 또는 design_implementation.md에 반영
```

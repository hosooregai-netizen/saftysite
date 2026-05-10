# 08_DESIGN_IMPLEMENTATION_PROMPT: Report List Design Implementation

```text
너는 ERP list management 디자인 구현을 담당하는 시니어 프론트엔드 엔지니어다.

목표:
작성 및 출력 이력 화면에서 작성 상태, 검토 상태, 출력 상태, 검색/필터/정렬을 빠르게 이해하도록 한다.

대상 route:
- /reports

대상 파일:
- apps/web/components/ReportsOverview.tsx
- apps/web/components/ReportsOverview.module.css
- apps/web/lib/reportApi.ts

반드시 먼저 읽을 문서:
- docs/safety-features/_design-system/specs/README.md
- docs/safety-features/_design-implementation/specs/GLOBAL_DESIGN_IMPLEMENTATION_RULES.md
- docs/safety-features/report-list/specs/ui_ux.md
- docs/safety-features/report-list/specs/validation.md
- docs/safety-features/report-list/specs/known_issues.md

구현 요구사항:
1. 상태 quick filter는 전체, 사진 수집중, 생성중, 검토 필요, 검토 완료, 출력 완료를 제공한다.
2. 출력 상태 filter는 미출력, PDF, HWPX, PDF/HWPX를 제공한다.
3. row는 site/headquarter, visitDate, status badge, export badge, 최근 출력 이력을 표시한다.
4. 검색 결과 없음과 전체 보고서 없음 empty state를 분리한다.
5. 같은 현장 새 작성 CTA는 siteId/headquarterId query를 유지한다.

Non-regression:
- 검색 input이 실제 list state와 분리되면 안 됨
- 출력 완료 report가 미출력처럼 보이면 안 됨

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

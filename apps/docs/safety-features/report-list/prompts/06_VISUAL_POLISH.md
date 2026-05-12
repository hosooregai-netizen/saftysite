# 06_VISUAL_POLISH

```text
너는 ERP 업무 화면의 보고서 목록 UI를 개선하는 시니어 UI 엔지니어다.

목표:
보고서 목록을 기존 ERP AppShell과 어울리게 유지하면서, 상태/검색/필터/row 가독성을 개선하라.

참조 문서:
- docs/safety-features/report-list/specs/ui_ux.md
- docs/safety-features/_design-system/specs/design_principles.md
- docs/safety-features/_design-system/specs/layout_patterns.md

대상 코드:
- apps/web/components/ReportsOverview.tsx
- 필요 시 관련 CSS

요구사항:
1. page header card는 유지한다.
2. report table/list는 카드 중첩을 과하게 만들지 않는다.
3. 검색/정렬/필터 toolbar를 정돈한다.
4. row hover/focus state를 명확히 한다.
5. status badge와 export badge를 읽기 쉽게 만든다.
6. empty/loading/error state를 보기 좋게 만든다.
7. 모바일에서는 row가 card stack처럼 읽히게 한다.
8. 웹하드/메일함 full-screen layout과 혼동되지 않게 ERP AppShell 패턴을 유지한다.

완료 기준:
- 보고서 목록이 ERP 업무 화면답고, 상태 파악이 빠르다.
- 반응형에서 정보가 깨지지 않는다.
```

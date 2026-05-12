# 03_IMPLEMENT_LIST_FILTER_SORT

```text
너는 보고서 목록 검색/필터/정렬 UX를 구현하는 시니어 프론트엔드 엔지니어다.

목표:
`ReportsOverview`의 검색 input과 정렬 select를 실제 동작하게 만들고, 빠른 필터를 추가하라.

참조 문서:
- docs/safety-features/report-list/specs/list_filter_sort.md
- docs/safety-features/report-list/specs/ui_ux.md
- docs/safety-features/report-list/specs/test_scenarios.md

대상 코드:
- apps/web/components/ReportsOverview.tsx
- 필요 시 CSS/global ERP utility

요구사항:
1. `query` state를 추가하라.
2. 현장명, 사업장명, 작성자, 지도일, 보고서 id 검색을 구현하라.
3. `sortKey` state를 추가하라.
4. 최종수정순, 지도일순, 검토 필요순, 출력 상태순 정렬을 구현하라.
5. 빠른 필터 chip을 추가하라.
   - 전체
   - 작성 중
   - 생성 중
   - 검토 필요
   - 검토 완료
   - 출력 완료
   - 미출력
6. 검색/필터 결과 없음 empty state를 추가하라.
7. 기존 report row click 동작을 깨지 마라.
8. 웹하드/메일함/보고서 작성 화면은 수정하지 마라.

완료 기준:
- 검색어 입력 시 목록이 즉시 필터링된다.
- 정렬 선택이 실제 row 순서를 바꾼다.
- 빠른 필터가 동작한다.
- 결과 없음 상태가 자연스럽다.
```

# Design Implementation Spec: Report List Design Implementation

## Layout Pattern

```text
ERP list management
```

## Target Routes

- /reports

## Design Goal

작성 및 출력 이력 화면에서 작성 상태, 검토 상태, 출력 상태, 검색/필터/정렬을 빠르게 이해하도록 한다.

## Implementation Requirements

1. 상태 quick filter는 전체, 사진 수집중, 생성중, 검토 필요, 검토 완료, 출력 완료를 제공한다.
2. 출력 상태 filter는 미출력, PDF, HWPX, PDF/HWPX를 제공한다.
3. row는 site/headquarter, visitDate, status badge, export badge, 최근 출력 이력을 표시한다.
4. 검색 결과 없음과 전체 보고서 없음 empty state를 분리한다.
5. 같은 현장 새 작성 CTA는 siteId/headquarterId query를 유지한다.

## Non-regression

- 검색 input이 실제 list state와 분리되면 안 됨
- 출력 완료 report가 미출력처럼 보이면 안 됨

## Target Files

- apps/web/components/ReportsOverview.tsx
- apps/web/components/ReportsOverview.module.css
- apps/web/lib/reportApi.ts

## QA

- clean build
- route smoke
- visual QA
- accessibility check
- feature-specific non-regression check

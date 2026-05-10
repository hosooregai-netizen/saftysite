# 01_READ_AND_PLAN: Report List

```text
너는 Next.js + FastAPI 기반 보고서 목록 기능을 분석하는 시니어 풀스택 엔지니어다.

목표:
`/reports` 보고서 목록 기능의 현재 코드, 데이터 흐름, API, UI 상태를 분석하고 개선 계획을 세워라. 아직 코드를 수정하지 마라.

반드시 확인할 문서:
- docs/safety-features/report-list/specs/feature.md
- docs/safety-features/report-list/specs/data_flow.md
- docs/safety-features/report-list/specs/schema.md
- docs/safety-features/report-list/specs/api_contract.md
- docs/safety-features/report-list/specs/known_issues.md
- docs/safety-features/report-workspace/specs/reverse_map.md

반드시 확인할 코드:
- apps/web/app/reports/page.tsx
- apps/web/components/ReportsOverview.tsx
- apps/web/lib/reportApi.ts
- apps/api/app/main.py
- apps/api/app/models.py
- apps/api/app/store.py

확인할 사항:
1. listReports의 local/generated/server merge 흐름
2. statusLabel/exportStatus 계산 기준
3. 검색 input과 정렬 select가 실제 동작하는지
4. row click/keyboard navigation
5. empty/loading/error state
6. workspace 권한 검사
7. admin/safety report endpoints와의 차이

산출물:
- 현재 구조 요약
- 문제점
- 구현 우선순위
- 변경 범위
- 테스트 계획
```

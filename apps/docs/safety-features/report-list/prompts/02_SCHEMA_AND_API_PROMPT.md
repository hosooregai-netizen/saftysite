# 02_SCHEMA_AND_API_PROMPT

```text
너는 보고서 목록의 row schema와 API contract를 정리하는 시니어 아키텍트다.

목표:
ReportRecord에서 ReportListRow view model을 도출하고, `/reports` 목록 API와 frontend listReports 계약을 명확히 하라.

대상 문서:
- docs/safety-features/report-list/specs/schema.md
- docs/safety-features/report-list/specs/api_contract.md
- docs/safety-features/report-list/specs/status_export.md
- docs/safety-features/report-list/specs/reverse_map.md

대상 코드:
- apps/web/components/ReportsOverview.tsx
- apps/web/lib/reportApi.ts
- apps/api/app/main.py
- apps/api/app/models.py

요구사항:
1. ReportListRow view model을 정의하라.
2. statusLabel/statusTone/exportStatus 계산식을 문서와 맞춰라.
3. reviewPendingCount 계산 기준을 검토하라.
4. GET /api/v1/reports response shape를 정리하라.
5. 향후 pagination/filter query 확장안을 문서화하라.
6. 앱 코드는 필요한 경우 최소 변경만 제안하라.

완료 기준:
- schema.md와 api_contract.md를 보고 목록 row를 재구현할 수 있다.
- status_export.md에 표시 상태 기준이 명확하다.
```

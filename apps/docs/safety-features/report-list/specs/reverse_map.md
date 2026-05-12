# Reverse Map: Report List

## 기능 목적

보고서 목록은 report-workspace로 진입하는 관문이며, 보고서 상태와 출력 이력을 요약한다.

## Route map

| Route | 역할 |
|---|---|
| `/reports` | 보고서 목록 |
| `/reports/new` | 새 보고서 작성 |
| `/reports/[reportId]` | 보고서 상세/검토 |

## Code map

| 흐름 | Frontend | Backend | 문서 |
|---|---|---|---|
| 목록 렌더링 | `ReportsOverview.tsx` | - | `ui_ux.md` |
| 세션 준비 | `bootstrapReportSession` | auth/workspace | `data_flow.md` |
| 목록 조회 | `listReports` | `GET /api/v1/reports` | `api_contract.md` |
| local merge | `listLocalReports`, snapshots | - | `data_flow.md` |
| 상태 표시 | `getReportStatusLabel` | `ReportRecord.status` | `status_export.md` |
| 출력 표시 | `getExportStatus` | `ReportExport[]` | `status_export.md` |
| 상세 이동 | `router.push(reportHref)` | `GET /api/v1/reports/{id}` | `user_flows.md` |

## Related feature map

| 기능 | 관계 |
|---|---|
| report-workspace | row 열기 대상 |
| headquarters-sites | siteName/customerName metadata source |
| billing-credits | export status/credit relation |
| mailbox | report attachment/mail dispatch relation |

## Prompt map

| Prompt | 목적 |
|---|---|
| `01_READ_AND_PLAN.md` | 현재 목록 구조 분석 |
| `02_SCHEMA_AND_API_PROMPT.md` | list row schema/API 정리 |
| `03_IMPLEMENT_LIST_FILTER_SORT.md` | 검색/필터/정렬 구현 |
| `04_IMPLEMENT_STATUS_EXPORT_BADGES.md` | 상태/출력 badge 개선 |
| `05_IMPLEMENT_REPORT_ACTIONS.md` | row action/keyboard/CTA 개선 |
| `06_VISUAL_POLISH.md` | ERP list UI 개선 |
| `07_QA_REGRESSION.md` | 회귀 테스트 |

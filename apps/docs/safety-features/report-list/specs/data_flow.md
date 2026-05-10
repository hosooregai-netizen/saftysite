# Data Flow: Report List

## Route to component

```text
/reports
→ apps/web/app/reports/page.tsx
→ ReportsOverview
```

## Frontend loading flow

```text
ReportsOverview mount
→ bootstrapReportSession({ preferredSession: readLastGeneratedReportSession() })
→ listReports(session)
→ setReports(nextReports)
```

## listReports flow

```text
listLocalReports()
→ readGeneratedReportSnapshots()
→ canUseReportServerApis(session) 확인
   ├─ false: local + generated snapshot만 병합
   └─ true:
      → GET /api/v1/reports?workspace_id={session.workspaceId}
      → normalizeReportRecord()
      → local + generated + server 병합
      → serverReports에 해당하는 generated snapshot 제거
→ sortReports()
→ ReportsOverview render
```

## Backend flow

```text
GET /api/v1/reports
→ require_user
→ require_workspace_access(workspace_id, user)
→ store.reports workspace filter
→ updated_at desc sort
→ serialize_report(report, user)
```

## Admin/safety list relation

```text
GET /api/v1/safety/reports
→ build_safety_report_list

GET /api/v1/admin/reports
→ build_admin_reports_response
```

`/reports` 화면의 기본 목록은 `GET /api/v1/reports`를 사용한다. 관리자/메일 첨부용 목록은 admin/safety endpoint와 별도 목적이다.

## Generated snapshot handling

```text
generated snapshot exists
→ row href = /reports/{id}?entry=generated
→ server report successfully loaded later
→ clearGeneratedReportSnapshot(report.id)
```

## Data dependencies

- `ReportRecord.status`
- `ReportRecord.payload.currentSection`
- `ReportRecord.payload.reportMeta`
- `ReportRecord.payload.reviewMeta.reviewQueue`
- `ReportRecord.payload.findingCandidates`
- `ReportRecord.exports`
- `ReportRecord.updated_at`

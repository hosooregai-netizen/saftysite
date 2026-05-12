# API Contract: Report List

## `GET /api/v1/reports`

workspace 기준 보고서 목록을 조회한다.

### Query

```ts
{
  workspace_id: string;
}
```

### Response

```ts
ReportRecord[]
```

### Backend behavior

```text
require_workspace_access(workspace_id, user)
→ store.reports에서 workspace_id 필터
→ updated_at desc 정렬
→ serialize_report(report, user)
```

### Error

| 상태 | 설명 |
|---|---|
| 401 | 인증 없음 |
| 403/404 | workspace 접근 권한 없음 |
| 500 | serialization 또는 store 오류 |

## `GET /api/v1/safety/reports`

업무 기준 보고서 목록. site/report_key 필터가 가능하다.

### Query

```ts
{
  active_only?: boolean;
  limit?: number;
  site_id?: string;
  report_key?: string;
}
```

## `GET /api/v1/admin/reports`

관리자/메일 첨부용 보고서 목록.

### Query

```ts
{
  limit?: number;
  offset?: number;
  mail_attachable_only?: boolean;
  query?: string;
  report_key?: string;
  site_id?: string;
  sort_by?: string;
  sort_dir?: 'asc' | 'desc';
}
```

## Frontend API

```ts
listReports(session: DemoSession): Promise<ReportRecord[]>
```

### Frontend behavior

- local reports 조회
- generated snapshots 조회
- server API 사용 가능하면 server reports 조회
- id 기준 merge
- server report가 있으면 해당 generated snapshot 제거
- sortReports 적용

## 향후 개선 API 제안

대량 데이터가 생기면 `/api/v1/reports`에 아래 query를 추가한다.

```ts
{
  workspace_id: string;
  query?: string;
  status?: string;
  export_format?: 'pdf' | 'hwpx' | 'any' | 'none';
  site_id?: string;
  headquarter_id?: string;
  updated_from?: string;
  updated_to?: string;
  sort_by?: 'updated_at' | 'visit_date' | 'status';
  sort_dir?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}
```

현재 MVP에서는 frontend filtering으로 시작할 수 있다.

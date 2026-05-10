# Schema: Report List

## Report list row view model

```ts
type ReportListRow = {
  id: string;
  sequenceLabel: string;
  reportHref: string;

  visitDate: string;
  siteName: string;
  customerName: string;
  drafterName?: string;

  statusLabel: string;
  statusTone: 'warning' | 'neutral' | 'info' | 'success';

  reviewPendingCount: number;
  findingCount: number;

  updatedAt: string;
  exportStatusLabel: string;
  exportCount: number;

  hasGeneratedSnapshot: boolean;
  localOnly?: boolean;
};
```

## Source model

```ts
type ReportRecord = {
  id: string;
  workspace_id: string;
  created_by: string;
  site_id?: string | null;
  headquarter_id?: string | null;
  status: ReportPayload['status'];
  payload: ReportPayload;
  review_completed: boolean;
  final_export_consumed: boolean;
  created_at: string;
  updated_at: string;
  exports: ReportExportRecord[];
  creditBalance?: number;
  sessionMode?: 'authenticated' | 'anonymous' | 'local';
  localOnly?: boolean;
};
```

## Status derived fields

```ts
function getReportStatusLabel(report: ReportRecord): string {
  if (report.status === 'exported') return '출력 완료';
  if (report.status === 'review_completed') return '검토 완료';
  if (report.payload.currentSection === 'ai-generating') return '생성중';
  if (report.status === 'draft_ready') return '검토 필요';
  return '사진 수집중';
}
```

## Export derived fields

```ts
function getExportStatus(report: ReportRecord): string {
  const formats = new Set(report.exports.map((item) => item.format));
  if (formats.has('pdf') && formats.has('hwpx')) return 'PDF/HWPX 출력';
  if (formats.has('pdf')) return 'PDF 출력';
  if (formats.has('hwpx')) return 'HWPX 출력';
  return '미출력';
}
```

## Schema notes

- `updated_at`는 backend snake_case 필드다.
- `payload.reportMeta.siteName`, `payload.reportMeta.customerName`, `payload.reportMeta.visitDate`가 row title에 사용된다.
- `payload.reviewMeta.reviewQueue`의 항목 구조가 변하면 review pending count 계산도 업데이트해야 한다.
- local/generated/server report merge 시 `id` 기준 중복 제거가 필요하다.

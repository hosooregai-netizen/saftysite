# API Contract: Report Workspace

## Reports

### `GET /api/v1/reports`

보고서 목록을 조회한다.

Response:

```ts
ReportRecord[]
```

### `POST /api/v1/reports`

새 보고서를 생성한다.

Request:

```ts
type CreateReportInput = {
  site_id?: string;
  headquarter_id?: string;
  payload?: Partial<ReportPayload>;
};
```

Response:

```ts
ReportRecord
```

### `GET /api/v1/reports/{report_id}`

단일 보고서를 조회한다.

Response:

```ts
ReportRecord
```

### `PATCH /api/v1/reports/{report_id}`

보고서 payload/status를 저장한다.

Request:

```ts
type UpdateReportInput = {
  payload?: ReportPayload;
  status?: ReportPayload['status'];
};
```

Response:

```ts
ReportRecord
```

## Photos

### `POST /api/v1/reports/{report_id}/photos`

일반 사진 업로드.

### `POST /api/v1/reports/{report_id}/photo-steps/step-1` ~ `step-5`

guided photo bucket별 사진 업로드.

Request:

```ts
type GuidedPhotoStepUploadInput = {
  photos: Array<{
    filename: string;
    contentType: string;
    dataUrl: string;
    caption?: string;
  }>;
};
```

Response:

```ts
{
  report: ReportRecord;
  photos: PhotoAsset[];
}
```

### `POST /api/v1/reports/{report_id}/photo-steps/review`

사진 후보/대표 사진 선택 결과 저장.

Request:

```ts
{
  doc3_photo_ids: string[];
  doc7_photo_ids: string[];
  representative_doc3_photo_id?: string;
  representative_doc7_photo_id?: string;
}
```

## AI Draft

### `POST /api/v1/reports/{report_id}/draft-from-photos`

선택 사진 기반 초안 생성.

### `POST /api/v1/reports/{report_id}/draft-from-guided-photos`

guided photo bucket 기반 초안 생성.

Request:

```ts
{
  doc3_photo_ids: string[];
  doc7_photo_ids: string[];
}
```

Response:

```ts
{
  aiRun: AiRun;
  report: ReportRecord;
}
```

### `GET /api/v1/reports/{report_id}/ai-runs/{run_id}`

AI run 상태 조회.

## Review

### `POST /api/v1/reports/{report_id}/review-complete`

검토 완료 처리.

Request:

```ts
{
  responsibility_confirmed: boolean;
}
```

Response:

```ts
ReportRecord
```

## Export

### `POST /api/v1/reports/{report_id}/exports/pdf`

PDF export 기록과 과금 처리.

### `POST /api/v1/reports/{report_id}/exports/hwpx`

HWPX export 기록과 과금 처리.

Request:

```ts
{
  confirm_reviewed: boolean;
  disclaimer_version?: string;
  disclaimer_accepted?: boolean;
}
```

Response:

```ts
{
  export: ReportExportRecord;
  balance: number;
  report: ReportRecord;
  exportDisclaimerAcceptance?: object;
}
```

### `GET /api/v1/reports/{report_id}/exports`

출력 이력 조회.

## Admin/Safety list

### `GET /api/v1/safety/reports`

업무 기준 보고서 목록.

### `GET /api/v1/admin/reports`

관리자용 보고서 목록.

### `GET /api/v1/admin/reports/{report_key}/original-pdf`

기존 PDF 다운로드 placeholder 또는 원본 PDF 다운로드.

## Error 기준

| 상황 | 상태 |
|---|---|
| report 없음 | 404 |
| workspace 권한 없음 | 403 또는 404 |
| 사진 없음 | 400 |
| guided bucket 불완전 | 400 |
| 검토 완료 전 export | 409 |
| credit 부족 | 402 또는 409 |
| disclaimer 미확인 | 409 |

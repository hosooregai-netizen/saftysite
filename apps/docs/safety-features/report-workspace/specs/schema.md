# Schema: Report Workspace

## ReportRecord

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
  exportDisclaimerAccepted: boolean;
  exportDisclaimerAcceptance?: ExportDisclaimerAcceptance | null;
  sessionMode?: 'authenticated' | 'anonymous' | 'local';
  localOnly?: boolean;
};
```

## ReportPayload 핵심 필드

```ts
type ReportPayload = {
  status: 'photo_collection' | 'draft_ready' | 'review_completed' | 'exported' | string;
  currentSection: string;
  wizardStep?: string;

  reportMeta: {
    customerName?: string;
    siteName?: string;
    visitDate?: string;
    drafterName?: string;
    processSummary?: string;
    progressRate?: string;
    notificationMethod?: string;
    previousImplementationStatus?: string;
  };

  guidedPhotoBuckets?: Record<string, GuidedPhotoBucket>;
  doc3PhotoCandidates?: string[];
  doc7PhotoCandidates?: string[];

  findingCandidates: FindingCandidate[];
  sectionDrafts: Record<string, unknown>;
  photoEvidence: PhotoEvidence[];

  reviewMeta: {
    reviewQueue: ReviewQueueItem[];
    reviewCompleted?: boolean;
    reviewCompletedAt?: string;
    responsibilityConfirmed?: boolean;
  };
};
```

## GuidedPhotoBucket

```ts
type GuidedPhotoBucket = {
  step: 'step-1' | 'step-2' | 'step-3' | 'step-4' | 'step-5';
  uploadedPhotoIds: string[];
  representativePhotoId?: string | null;
  status: 'empty' | 'uploaded' | 'reviewed';
};
```

## PhotoAsset

```ts
type PhotoAsset = {
  id: string;
  report_id: string;
  workspace_id: string;
  filename: string;
  content_type: string;
  data_url?: string;
  caption?: string;
  step?: string;
  created_at: string;
};
```

## AiRun

```ts
type AiRun = {
  id: string;
  report_id: string;
  status: 'queued' | 'running' | 'succeeded' | 'failed';
  input?: unknown;
  output?: unknown;
  error?: string | null;
  created_at: string;
  updated_at: string;
};
```

## ReportExport

```ts
type ReportExportRecord = {
  id: string;
  report_id: string;
  format: 'pdf' | 'hwpx';
  first_charge_applied: boolean;
  created_at: string;
};
```

## FindingCandidate

```ts
type FindingCandidate = {
  linkedPhotoIds: string[];
  location: string;
  hazardDescription: string;
  accidentType: string;
  causativeAgentKey: string;
  riskLevel: '상' | '중' | '하' | string;
  improvementPlan: string;
  emphasis: string;
  legalReferenceCandidates: string[];
  referenceMaterialCandidates: string[];
  confidence: number;
  needsReview: boolean;
};
```

## Schema 관리 원칙

- frontend `ReportPayload`는 `@saftysite/contracts`의 `reportPayloadSchema` 기준을 따른다.
- backend `ReportRecord.payload`는 프론트 payload와 호환되어야 한다.
- 새 필드를 추가할 때는 local snapshot, generated snapshot, server payload 모두 호환되어야 한다.
- review/export gate와 관련된 상태는 `status`, `review_completed`, `payload.reviewMeta`를 함께 확인한다.

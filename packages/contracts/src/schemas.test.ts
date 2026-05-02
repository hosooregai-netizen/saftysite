import assert from 'node:assert/strict';
import test from 'node:test';

import { createReportInputSchema, reportPayloadSchema } from './schemas';

test('createReportInputSchema requires core metadata', () => {
  const result = createReportInputSchema.safeParse({
    workspace_id: 'workspace-1',
    site_name: '현장명',
    customer_name: '고객사',
    visit_date: '2026-04-29',
    drafter_name: '홍길동',
  });

  assert.equal(result.success, true);
});

test('reportPayloadSchema validates photo-first payload shape', () => {
  const result = reportPayloadSchema.safeParse({
    id: 'report-1',
    workspaceId: 'workspace-1',
    status: 'draft_ready',
    currentSection: 'review',
    reportMeta: {
      workspaceName: 'Demo',
      siteName: '세종 현장',
      customerName: '대한건설',
      guidanceAgencyName: '대한안전산업연구원',
      visitDate: '2026-04-29',
      drafterName: '홍길동',
      progressRate: '67%',
      processSummary: '철골 조립',
      workerCount: '24명',
      siteAddress: '',
      siteContact: '',
      reportPriceKrw: 3000,
    },
    reviewMeta: {
      reviewCompleted: false,
      reviewCompletedAt: null,
      responsibilityConfirmed: false,
      requiredFieldPaths: ['reportMeta.siteName'],
      reviewQueue: [],
    },
    aiMeta: {
      pipelineVersion: 'v1-photo-first',
      lastRunId: null,
      lastRunStatus: 'queued',
      generatedAt: null,
      sourceMix: ['manual'],
    },
    wizardStep: 'step1_overview',
    photoStepBuckets: [
      {
        step: 'step1_overview',
        title: '공정 및 전경',
        description: '전경과 현재 공정을 설명하는 사진',
        minRequired: 2,
        uploadedPhotoIds: ['photo-1'],
        representativePhotoId: 'photo-1',
        status: 'pending',
      },
    ],
    photoChecklistStatus: {
      step1OverviewComplete: false,
      step2HazardComplete: false,
      reviewReady: false,
      minimumSatisfied: false,
    },
    doc3PhotoCandidates: ['photo-1'],
    doc7PhotoCandidates: [],
    workspaceEntryMode: 'guided_photo_flow',
    doc11Doc12AutofillMode: 'resource_autofill',
    photoEvidence: [],
    findingCandidates: [],
    sectionDrafts: {
      doc5: {
        progressOverview: '',
        accidentTrend: '',
        findingCase: '',
        workEnvironmentRisk: '',
        futureProcessFocus: '',
      },
      doc7: [],
      doc8: [],
      doc11: [],
      doc12: [],
      doc13: [],
      doc14: {
        title: '',
        body: '',
        confidence: 0.2,
      },
    },
    validationResult: {
      valid: false,
      blockingIssues: [],
      warnings: [],
      reviewedFieldPaths: [],
    },
    documentsCompat: {},
    createdAt: '2026-04-29T08:00:00.000Z',
    updatedAt: '2026-04-29T08:00:00.000Z',
  });

  assert.equal(result.success, true);
});

'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { reportPayloadSchema, type ReportPayload } from '@saftysite/contracts';
import {
  bootstrapDemoSession,
  bootstrapReportSession,
  canUseReportServerApis,
  isAuthenticatedSession,
  isLocalReportId,
  isLocalSession,
  markReportReviewComplete,
  patchReportRecord,
  removeLocalReport,
  type ReportRecord,
  registerReportExport,
  type DemoSession,
  syncLocalReportToServer,
} from '@/lib/reportApi';
import {
  reportWorkspaceSections,
  resolveReportWorkspaceSectionId,
  type ReportWorkspaceSectionId,
} from '@/lib/demoData';
import { mapReportPayloadToInspectionSession } from '@/lib/reportSessionMapper';
import { beginGoogleWorkspaceAuth } from '@/lib/sessionAuthFlow';
import { fetchInspectionHwpxDocument, fetchInspectionPdfDocument, saveBlobAsFile } from '../../../lib/api';
import styles from './ReportWorkspace.module.css';

type WorkspaceDraft = {
  reportMeta: ReportPayload['reportMeta'];
  sectionDrafts: ReportPayload['sectionDrafts'];
  findingCandidates: ReportPayload['findingCandidates'];
  photoEvidence: ReportPayload['photoEvidence'];
};
type ReviewQueueItem = ReportPayload['reviewMeta']['reviewQueue'][number];
type PhotoObservationCard = ReportPayload['photoObservations'][number];
type FieldProvenance = ReportPayload['fieldProvenance'][number];

type FollowUpRow = {
  id: string;
  location: string;
  hazardDescription: string;
  actionRequired: string;
  result: '이행' | '미이행' | '확인 필요';
  guidanceDate: string;
  confirmationDate: string;
  beforePhotoUrl: string;
  afterPhotoUrl: string;
};

type SaveState = 'idle' | 'saving' | 'saved' | 'error';
type DownloadState = 'idle' | 'hwpx' | 'pdf';
type PendingDownloadContext = {
  reportSession: DemoSession;
  targetReportId: string;
  payloadOverride?: ReportPayload;
};

const NOTIFICATION_METHOD_OPTIONS: Array<{
  label: string;
  value: ReportPayload['reportMeta']['notificationMethod'];
}> = [
  { value: '', label: '선택' },
  { value: 'direct', label: '직접전달' },
  { value: 'registered_mail', label: '등기우편' },
  { value: 'email', label: '전자우편' },
  { value: 'mobile', label: '모바일' },
  { value: 'other', label: '기타' },
];

const PREVIOUS_IMPLEMENTATION_STATUS_OPTIONS: Array<{
  label: string;
  value: ReportPayload['reportMeta']['previousImplementationStatus'];
}> = [
  { value: '', label: '선택' },
  { value: 'implemented', label: '이행' },
  { value: 'partial', label: '일부 이행' },
  { value: 'not_implemented', label: '불이행' },
  { value: 'not_applicable', label: '해당없음' },
];

const EMPTY_FINDING: ReportPayload['findingCandidates'][number] = {
  linkedPhotoIds: [],
  location: '',
  hazardDescription: '',
  accidentType: '',
  causativeAgentKey: '',
  riskLevel: '중',
  improvementPlan: '',
  emphasis: '',
  legalReferenceCandidates: [],
  referenceMaterialCandidates: [],
  confidence: 0,
  needsReview: true,
};

const EMPTY_PLAN: ReportPayload['sectionDrafts']['doc8'][number] = {
  processName: '',
  hazard: '',
  countermeasure: '',
  note: '',
  evidencePhotoIds: [],
  confidence: 0,
};

const EMPTY_EDUCATION: ReportPayload['sectionDrafts']['doc11'][number] = {
  topic: '',
  content: '',
  attendeeCount: '',
  confidence: 0,
};

const EMPTY_SUPPORT: ReportPayload['sectionDrafts']['doc12'][number] = {
  activityType: '',
  content: '',
  confidence: 0,
};

function safeText(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function formatConfidence(value: unknown): string {
  return typeof value === 'number' && Number.isFinite(value)
    ? `${Math.round(value * 100)}%`
    : '확인 필요';
}

function provenanceStatusLabel(provenance: FieldProvenance | undefined): string {
  if (!provenance) {
    return '수동 수정';
  }
  if (provenance.needsReview) {
    return '확인 필요';
  }
  if (provenance.source === 'RISK_LIBRARY' || provenance.source === 'RULE_TEMPLATE') {
    return '표준 매칭';
  }
  if (provenance.source === 'AI_PHOTO') {
    return 'AI 채움';
  }
  return '수동 수정';
}

function buildReviewItemId(fieldPath: string): string {
  return `rq-${fieldPath.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '') || 'item'}`;
}

function inferReviewItemSection(fieldPath: string): ReviewQueueItem['section'] {
  if (fieldPath.startsWith('reportMeta.')) {
    return fieldPath === 'reportMeta.notificationMethod' ? 'dispatch' : 'reportMeta';
  }
  if (fieldPath.startsWith('findingCandidates[')) {
    return 'doc4';
  }
  if (fieldPath.startsWith('sectionDrafts.doc8[')) {
    return 'doc5';
  }
  if (fieldPath.startsWith('photoObservations[')) {
    return 'photoObservations';
  }
  return 'other';
}

function inferReviewItemField(fieldPath: string): string {
  const tokens = tokenizeFieldPath(fieldPath);
  const lastToken = tokens[tokens.length - 1];
  return typeof lastToken === 'string' ? lastToken : fieldPath.split('.').at(-1) ?? fieldPath;
}

function tokenizeFieldPath(fieldPath: string): Array<string | number> {
  const tokens: Array<string | number> = [];
  const pattern = /([^[.\]]+)|\[(\d+)\]/g;
  for (const match of fieldPath.matchAll(pattern)) {
    if (match[1]) {
      tokens.push(match[1]);
      continue;
    }
    if (match[2]) {
      tokens.push(Number(match[2]));
    }
  }
  return tokens;
}

function readFieldPathValue(payload: ReportPayload, fieldPath: string): string {
  if (fieldPath.startsWith('photoStepBuckets.')) {
    const step = fieldPath.replace('photoStepBuckets.', '');
    const bucket = payload.photoStepBuckets.find((item) => item.step === step);
    if (!bucket) {
      return '';
    }
    return bucket.uploadedPhotoIds.join(', ');
  }

  let current: unknown = payload;
  for (const token of tokenizeFieldPath(fieldPath)) {
    if (typeof token === 'number') {
      if (!Array.isArray(current) || token >= current.length) {
        return '';
      }
      current = current[token];
      continue;
    }
    if (!current || typeof current !== 'object' || !(token in current)) {
      return '';
    }
    current = (current as Record<string, unknown>)[token];
  }

  if (current == null) {
    return '';
  }
  return typeof current === 'string' ? current : String(current);
}

function normalizeReviewQueueItem(
  item: ReviewQueueItem,
  payload: ReportPayload,
): ReviewQueueItem {
  const currentValue =
    readFieldPathValue(payload, item.fieldPath) || safeText(item.currentValue ?? item.value);
  const manuallyResolved = Boolean(item.resolved) || item.status === 'reviewed' || item.status === 'confirmed';
  const autoResolved =
    (!manuallyResolved &&
      ((item.fieldPath.startsWith('reportMeta.') && Boolean(currentValue)) ||
        (item.fieldPath.startsWith('photoStepBuckets.') && Boolean(currentValue)) ||
        (Boolean(currentValue) &&
          Boolean(safeText(item.suggestedValue)) &&
          currentValue !== safeText(item.suggestedValue)))) ||
    false;
  const resolved = manuallyResolved || autoResolved;

  return {
    ...item,
    id: item.id || buildReviewItemId(item.fieldPath),
    section: item.section ?? inferReviewItemSection(item.fieldPath),
    field: item.field || inferReviewItemField(item.fieldPath),
    value: currentValue,
    currentValue,
    reason: safeText(item.reason) || safeText(item.notes),
    severity: item.severity ?? 'warning',
    resolved,
    status: resolved ? (item.status === 'confirmed' ? 'confirmed' : 'reviewed') : 'pending',
    needsReview: !resolved,
    evidencePhotoIds: [...(item.evidencePhotoIds ?? [])],
    notes: safeText(item.notes) || safeText(item.reason),
  };
}

function buildMissingReviewQueueItems(payload: ReportPayload): ReviewQueueItem[] {
  const requiredMetaItems: Array<{
    fieldPath: string;
    label: string;
    section: ReviewQueueItem['section'];
    field: string;
    reason: string;
  }> = [
    {
      fieldPath: 'reportMeta.progressRate',
      label: '공정률',
      section: 'reportMeta',
      field: 'progressRate',
      reason: '행정 필수값이 비어 있어 사용자 확인이 필요합니다.',
    },
    {
      fieldPath: 'reportMeta.previousImplementationStatus',
      label: '이전 기술지도 이행여부',
      section: 'reportMeta',
      field: 'previousImplementationStatus',
      reason: '이전 기술지도 이행여부는 사용자가 최종 확정해야 합니다.',
    },
    {
      fieldPath: 'reportMeta.notificationMethod',
      label: '통보방법',
      section: 'dispatch',
      field: 'notificationMethod',
      reason: '통보방법은 사용자가 선택해야 합니다.',
    },
  ];

  return requiredMetaItems
    .filter((item) => !safeText(readFieldPathValue(payload, item.fieldPath)))
    .map((item) => ({
      id: buildReviewItemId(item.fieldPath),
      section: item.section,
      field: item.field,
      fieldPath: item.fieldPath,
      label: item.label,
      currentValue: '',
      suggestedValue: '',
      source: item.fieldPath === 'reportMeta.progressRate' ? 'DATA' : 'USER_INPUT',
      confidence: 0.1,
      reason: item.reason,
      severity: 'required',
      needsReview: true,
      status: 'pending',
      evidencePhotoIds: [],
      resolved: false,
      notes: item.reason,
    }));
}

function buildWorkspaceReviewQueue(
  payload: ReportPayload,
  existingQueue: ReportPayload['reviewMeta']['reviewQueue'],
): ReportPayload['reviewMeta']['reviewQueue'] {
  const queueByPath = new Map<string, ReviewQueueItem>();
  [...existingQueue, ...buildMissingReviewQueueItems(payload)].forEach((item) => {
    if (!item.fieldPath) {
      return;
    }
    const normalizedItem = normalizeReviewQueueItem(item, payload);
    const existing = queueByPath.get(normalizedItem.fieldPath);
    if (!existing) {
      queueByPath.set(normalizedItem.fieldPath, normalizedItem);
      return;
    }
    queueByPath.set(normalizedItem.fieldPath, {
      ...normalizedItem,
      id: existing.id || normalizedItem.id,
      resolved: existing.resolved || normalizedItem.resolved,
      status:
        existing.status === 'confirmed'
          ? 'confirmed'
          : existing.resolved || normalizedItem.resolved
            ? 'reviewed'
            : normalizedItem.status,
      needsReview: !(existing.resolved || normalizedItem.resolved),
      currentValue: normalizedItem.currentValue,
      value: normalizedItem.currentValue,
      evidencePhotoIds:
        normalizedItem.evidencePhotoIds.length > 0
          ? normalizedItem.evidencePhotoIds
          : existing.evidencePhotoIds,
    });
  });
  return Array.from(queueByPath.values());
}

function buildValidationResultWithReviewQueue(
  payload: ReportPayload,
  reviewQueue: ReportPayload['reviewMeta']['reviewQueue'],
  existingValidation: ReportPayload['validationResult'],
  standardWarnings: string[],
  blockingIssues: string[],
): ReportPayload['validationResult'] {
  const unresolvedRequired = reviewQueue.filter(
    (item) => item.severity === 'required' && !item.resolved,
  );
  const unresolvedAdvisories = reviewQueue.filter(
    (item) => (item.severity === 'warning' || item.severity === 'info') && !item.resolved,
  );
  const mergedBlockingIssues = Array.from(
    new Set([
      ...blockingIssues,
      ...existingValidation.blockingIssues,
      ...unresolvedRequired.map(
        (item) => `${item.label}: ${safeText(item.reason) || '사용자 확인이 필요합니다.'}`,
      ),
    ]),
  );
  const mergedWarnings = Array.from(
    new Set([
      ...existingValidation.warnings,
      ...standardWarnings,
      ...(unresolvedRequired.length > 0 ? ['출력 전 필수 확인 항목이 남아 있습니다.'] : []),
      ...(unresolvedAdvisories.length > 0 ? ['검토 권장 항목이 남아 있습니다.'] : []),
    ]),
  );

  return {
    ...existingValidation,
    valid: mergedBlockingIssues.length === 0,
    blockingIssues: mergedBlockingIssues,
    warnings: mergedWarnings,
    reviewedFieldPaths: reviewQueue.filter((item) => item.resolved).map((item) => item.fieldPath),
  };
}

function buildPreview(title: string, subtitle: string) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 420"><rect width="640" height="420" fill="#e3ebf2"/><rect x="34" y="34" width="572" height="352" rx="24" fill="rgba(255,255,255,0.78)" stroke="rgba(33,55,74,0.12)"/><text x="50%" y="46%" text-anchor="middle" font-size="26" fill="#21374a" font-family="Arial" font-weight="700">${title}</text><text x="50%" y="58%" text-anchor="middle" font-size="15" fill="#5f6e7c" font-family="Arial">${subtitle}</text></svg>`,
  )}`;
}

function buildStandardWarnings(workspace: WorkspaceDraft) {
  const missingLabels: string[] = [];
  const meta = workspace.reportMeta;
  const education = workspace.sectionDrafts.doc11[0] ?? EMPTY_EDUCATION;
  const support = workspace.sectionDrafts.doc12[0] ?? EMPTY_SUPPORT;
  const supportMemo = workspace.sectionDrafts.doc14;

  const requiredFields: Array<[string, string]> = [
    ['siteName', '현장명'],
    ['customerName', '고객사명'],
    ['visitDate', '기술지도실시일'],
    ['drafterName', '담당 요원'],
    ['siteManagementNumber', '사업장관리번호'],
    ['businessStartNumber', '사업개시번호'],
    ['constructionPeriod', '공사기간'],
    ['constructionAmount', '공사금액'],
    ['siteManagerName', '현장 책임자'],
    ['siteContact', '현장 연락처'],
    ['siteAddress', '현장 주소'],
    ['corporationRegistrationNumber', '법인등록번호'],
    ['businessRegistrationNumber', '사업자등록번호'],
    ['licenseNumber', '면허번호'],
    ['headquartersContact', '본사 연락처'],
    ['headquartersAddress', '본사 주소'],
    ['guidanceAgencyName', '지도기관명'],
    ['constructionType', '구분'],
    ['progressRate', '공정률'],
    ['visitCount', '회차'],
    ['totalVisitCount', '총 회차'],
  ];

  requiredFields.forEach(([field, label]) => {
    if (!safeText(meta[field as keyof ReportPayload['reportMeta']])) {
      missingLabels.push(label);
    }
  });

  if (meta.notificationMethod === 'direct' && !safeText(meta.notificationRecipientName)) {
    missingLabels.push('직접전달 성함');
  }
  if (meta.notificationMethod === 'other' && !safeText(meta.otherNotificationMethod)) {
    missingLabels.push('기타 통보방법');
  }
  if (
    !safeText(education.topic) &&
    !safeText(education.content) &&
    !safeText(support.activityType) &&
    !safeText(support.content) &&
    !safeText(supportMemo.body)
  ) {
    missingLabels.push('사업장 지원 사항');
  }

  return missingLabels.map((label) => `${label} 입력 필요`);
}

function buildBlockingIssues(workspace: WorkspaceDraft) {
  const meta = workspace.reportMeta;
  const blockingIssues: string[] = [];
  const requiredFields: Array<[keyof ReportPayload['reportMeta'], string]> = [
    ['siteName', '현장명'],
    ['customerName', '고객사명'],
    ['visitDate', '기술지도실시일'],
    ['drafterName', '담당 요원'],
    ['siteAddress', '현장 주소'],
    ['siteContact', '현장 연락처'],
    ['progressRate', '공정률'],
    ['visitCount', '회차'],
    ['totalVisitCount', '총 회차'],
  ];

  requiredFields.forEach(([field, label]) => {
    if (!safeText(meta[field])) {
      blockingIssues.push(`${label} 입력이 필요합니다.`);
    }
  });

  if (!workspace.reportMeta.notificationMethod) {
    blockingIssues.push('통보방법 입력이 필요합니다.');
  }
  if (!workspace.findingCandidates.some((item) => safeText(item.location) && safeText(item.improvementPlan))) {
    blockingIssues.push('4번 현재 위험성 제거 초안 확인이 필요합니다.');
  }

  return blockingIssues;
}

function normalizeReport(report: ReportPayload): ReportPayload {
  return reportPayloadSchema.parse(report);
}

function buildWorkspaceDraft(report: ReportPayload): WorkspaceDraft {
  const normalized = normalizeReport(report);
  return {
    reportMeta: {
      ...normalized.reportMeta,
      workspaceName: safeText(normalized.reportMeta.workspaceName),
      siteName: safeText(normalized.reportMeta.siteName),
      customerName: safeText(normalized.reportMeta.customerName),
      guidanceAgencyName: safeText(normalized.reportMeta.guidanceAgencyName),
      visitDate: safeText(normalized.reportMeta.visitDate),
      drafterName: safeText(normalized.reportMeta.drafterName),
      siteManagementNumber: safeText(normalized.reportMeta.siteManagementNumber),
      businessStartNumber: safeText(normalized.reportMeta.businessStartNumber),
      constructionPeriod: safeText(normalized.reportMeta.constructionPeriod),
      constructionAmount: safeText(normalized.reportMeta.constructionAmount),
      siteManagerName: safeText(normalized.reportMeta.siteManagerName),
      corporationRegistrationNumber: safeText(
        normalized.reportMeta.corporationRegistrationNumber,
      ),
      businessRegistrationNumber: safeText(
        normalized.reportMeta.businessRegistrationNumber,
      ),
      licenseNumber: safeText(normalized.reportMeta.licenseNumber),
      headquartersContact: safeText(normalized.reportMeta.headquartersContact),
      headquartersAddress: safeText(normalized.reportMeta.headquartersAddress),
      constructionType: safeText(normalized.reportMeta.constructionType),
      visitCount: safeText(normalized.reportMeta.visitCount),
      totalVisitCount: safeText(normalized.reportMeta.totalVisitCount),
      previousImplementationStatus: normalized.reportMeta.previousImplementationStatus,
      notificationMethod: normalized.reportMeta.notificationMethod,
      notificationRecipientName: safeText(normalized.reportMeta.notificationRecipientName),
      otherNotificationMethod: safeText(normalized.reportMeta.otherNotificationMethod),
      progressRate: safeText(normalized.reportMeta.progressRate),
      processSummary: safeText(normalized.reportMeta.processSummary),
      workerCount: safeText(normalized.reportMeta.workerCount),
      siteAddress: safeText(normalized.reportMeta.siteAddress),
      siteContact: safeText(normalized.reportMeta.siteContact),
    },
    sectionDrafts: {
      ...normalized.sectionDrafts,
      doc5: {
        progressOverview: safeText(normalized.sectionDrafts.doc5.progressOverview),
        accidentTrend: safeText(normalized.sectionDrafts.doc5.accidentTrend),
        findingCase: safeText(normalized.sectionDrafts.doc5.findingCase),
        workEnvironmentRisk: safeText(normalized.sectionDrafts.doc5.workEnvironmentRisk),
        futureProcessFocus: safeText(normalized.sectionDrafts.doc5.futureProcessFocus),
      },
      doc7: normalized.sectionDrafts.doc7.map((item) => ({
        ...item,
        location: safeText(item.location),
        hazardDescription: safeText(item.hazardDescription),
        accidentType: safeText(item.accidentType),
        causativeAgentKey: safeText(item.causativeAgentKey),
        improvementPlan: safeText(item.improvementPlan),
        emphasis: safeText(item.emphasis),
      })),
      doc8:
        normalized.sectionDrafts.doc8.length > 0
          ? normalized.sectionDrafts.doc8.map((item) => ({
              ...item,
              processName: safeText(item.processName),
              hazard: safeText(item.hazard),
              countermeasure: safeText(item.countermeasure),
              note: safeText(item.note),
              evidencePhotoIds: [...(item.evidencePhotoIds ?? [])],
            }))
          : [{ ...EMPTY_PLAN }],
      doc11:
        normalized.sectionDrafts.doc11.length > 0
          ? normalized.sectionDrafts.doc11.map((item) => ({
              ...item,
              topic: safeText(item.topic),
              content: safeText(item.content),
              attendeeCount: safeText(item.attendeeCount),
            }))
          : [{ ...EMPTY_EDUCATION }],
      doc12:
        normalized.sectionDrafts.doc12.length > 0
          ? normalized.sectionDrafts.doc12.map((item) => ({
              ...item,
              activityType: safeText(item.activityType),
              content: safeText(item.content),
            }))
          : [{ ...EMPTY_SUPPORT }],
      doc13: normalized.sectionDrafts.doc13.map((item) => ({
        ...item,
        title: safeText(item.title),
        summary: safeText(item.summary),
      })),
      doc14: {
        ...normalized.sectionDrafts.doc14,
        title: safeText(normalized.sectionDrafts.doc14.title),
        body: safeText(normalized.sectionDrafts.doc14.body),
      },
    },
    findingCandidates:
      normalized.findingCandidates.length > 0
        ? normalized.findingCandidates.map((item) => ({
            ...item,
            location: safeText(item.location),
            hazardDescription: safeText(item.hazardDescription),
            accidentType: safeText(item.accidentType),
            causativeAgentKey: safeText(item.causativeAgentKey),
            improvementPlan: safeText(item.improvementPlan),
            emphasis: safeText(item.emphasis),
            linkedPhotoIds: [...item.linkedPhotoIds],
            legalReferenceCandidates: [...item.legalReferenceCandidates],
            referenceMaterialCandidates: [...item.referenceMaterialCandidates],
          }))
        : normalized.sectionDrafts.doc7.length > 0
          ? normalized.sectionDrafts.doc7.map((item) => ({
              ...item,
              location: safeText(item.location),
              hazardDescription: safeText(item.hazardDescription),
              accidentType: safeText(item.accidentType),
              causativeAgentKey: safeText(item.causativeAgentKey),
              improvementPlan: safeText(item.improvementPlan),
              emphasis: safeText(item.emphasis),
              linkedPhotoIds: [...item.linkedPhotoIds],
              legalReferenceCandidates: [...item.legalReferenceCandidates],
              referenceMaterialCandidates: [...item.referenceMaterialCandidates],
            }))
          : [{ ...EMPTY_FINDING }],
    photoEvidence: normalized.photoEvidence.map((item) => ({
      ...item,
      filename: safeText(item.filename),
      imageUrl: safeText(item.imageUrl),
      sceneType: safeText(item.sceneType),
      processType: safeText(item.processType),
      locationHint: safeText(item.locationHint),
      notes: safeText(item.notes),
      ppeSignals: [...item.ppeSignals],
      hazardSignals: [...item.hazardSignals],
      accidentTypeCandidates: [...item.accidentTypeCandidates],
      causativeAgentCandidates: [...item.causativeAgentCandidates],
    })),
  };
}

function buildFollowUpRows(report: ReportPayload): FollowUpRow[] {
  const items = Array.isArray(report.documentsCompat.document4FollowUps)
    ? report.documentsCompat.document4FollowUps
    : [];

  const rows = items
    .map((item, index) => {
      if (!item || typeof item !== 'object') {
        return null;
      }
      const source = item as Record<string, unknown>;
      return {
        id: safeText(source.id) || `follow-up-${index + 1}`,
        location: safeText(source.location),
        hazardDescription: safeText(source.hazardDescription) || safeText(source.issue),
        actionRequired: safeText(source.actionRequired),
        result:
          source.result === '이행' || source.result === '미이행' || source.result === '확인 필요'
            ? source.result
            : '확인 필요',
        guidanceDate: safeText(source.guidanceDate),
        confirmationDate: safeText(source.confirmationDate),
        beforePhotoUrl: safeText(source.beforePhotoUrl),
        afterPhotoUrl: safeText(source.afterPhotoUrl),
      } satisfies FollowUpRow;
    })
    .filter((item): item is FollowUpRow => Boolean(item));

  if (rows.length > 0) {
    return rows;
  }

  return [
    {
      id: 'follow-up-1',
      location: '',
      hazardDescription: '',
      actionRequired: '',
      result: '확인 필요',
      guidanceDate: '',
      confirmationDate: report.reportMeta.visitDate,
      beforePhotoUrl: '',
      afterPhotoUrl: '',
    },
  ];
}

function getSectionStorageKey(sectionId: ReportWorkspaceSectionId): string {
  if (sectionId === 'section1') return 'doc1';
  if (sectionId === 'section2') return 'doc2';
  if (sectionId === 'section3') return 'doc3';
  if (sectionId === 'section4') return 'doc7';
  if (sectionId === 'section5') return 'doc8';
  return 'doc11';
}

function buildPersistedReport(
  report: ReportPayload,
  workspace: WorkspaceDraft,
  followUpRows: FollowUpRow[],
  activeSectionId: ReportWorkspaceSectionId,
): ReportPayload {
  const standardWarnings = buildStandardWarnings(workspace);
  const blockingIssues = buildBlockingIssues(workspace);
  const nextPayload = reportPayloadSchema.parse({
    ...report,
    currentSection: getSectionStorageKey(activeSectionId),
    wizardStep: 'workspace',
    reportMeta: {
      ...report.reportMeta,
      ...workspace.reportMeta,
      siteName: safeText(workspace.reportMeta.siteName) || safeText(report.reportMeta.siteName) || '현장명',
      customerName:
        safeText(workspace.reportMeta.customerName) ||
        safeText(report.reportMeta.customerName) ||
        '고객사',
      visitDate: safeText(workspace.reportMeta.visitDate) || safeText(report.reportMeta.visitDate) || report.createdAt.slice(0, 10),
      drafterName:
        safeText(workspace.reportMeta.drafterName) ||
        safeText(report.reportMeta.drafterName) ||
        '작성자',
      siteManagementNumber: safeText(workspace.reportMeta.siteManagementNumber),
      businessStartNumber: safeText(workspace.reportMeta.businessStartNumber),
      constructionPeriod: safeText(workspace.reportMeta.constructionPeriod),
      constructionAmount: safeText(workspace.reportMeta.constructionAmount),
      siteManagerName: safeText(workspace.reportMeta.siteManagerName),
      corporationRegistrationNumber: safeText(
        workspace.reportMeta.corporationRegistrationNumber,
      ),
      businessRegistrationNumber: safeText(
        workspace.reportMeta.businessRegistrationNumber,
      ),
      licenseNumber: safeText(workspace.reportMeta.licenseNumber),
      headquartersContact: safeText(workspace.reportMeta.headquartersContact),
      headquartersAddress: safeText(workspace.reportMeta.headquartersAddress),
      constructionType: safeText(workspace.reportMeta.constructionType),
      visitCount: safeText(workspace.reportMeta.visitCount),
      totalVisitCount: safeText(workspace.reportMeta.totalVisitCount),
      previousImplementationStatus: workspace.reportMeta.previousImplementationStatus,
      notificationMethod: workspace.reportMeta.notificationMethod,
      notificationRecipientName: safeText(workspace.reportMeta.notificationRecipientName),
      otherNotificationMethod: safeText(workspace.reportMeta.otherNotificationMethod),
      progressRate: safeText(workspace.reportMeta.progressRate),
      processSummary: safeText(workspace.reportMeta.processSummary),
      workerCount: safeText(workspace.reportMeta.workerCount),
      siteAddress: safeText(workspace.reportMeta.siteAddress),
      siteContact: safeText(workspace.reportMeta.siteContact),
    },
    findingCandidates: workspace.findingCandidates.map((item) => ({
      ...item,
      location: safeText(item.location),
      hazardDescription: safeText(item.hazardDescription),
      accidentType: safeText(item.accidentType),
      causativeAgentKey: safeText(item.causativeAgentKey),
      improvementPlan: safeText(item.improvementPlan),
      emphasis: safeText(item.emphasis),
    })),
    sectionDrafts: {
      ...workspace.sectionDrafts,
      doc7: workspace.findingCandidates.map((item) => ({
        ...item,
        location: safeText(item.location),
        hazardDescription: safeText(item.hazardDescription),
        accidentType: safeText(item.accidentType),
        causativeAgentKey: safeText(item.causativeAgentKey),
        improvementPlan: safeText(item.improvementPlan),
        emphasis: safeText(item.emphasis),
      })),
      doc8: workspace.sectionDrafts.doc8.map((item) => ({
        ...item,
        processName: safeText(item.processName),
        hazard: safeText(item.hazard),
        countermeasure: safeText(item.countermeasure),
        note: safeText(item.note),
        evidencePhotoIds: [...(item.evidencePhotoIds ?? [])],
      })),
      doc11: workspace.sectionDrafts.doc11.map((item) => ({
        ...item,
        topic: safeText(item.topic),
        content: safeText(item.content),
        attendeeCount: safeText(item.attendeeCount),
      })),
    },
    photoEvidence: workspace.photoEvidence.map((item) => ({
      ...item,
      filename: safeText(item.filename),
      imageUrl: safeText(item.imageUrl),
      locationHint: safeText(item.locationHint),
    })),
    validationResult: {
      ...report.validationResult,
      valid: blockingIssues.length === 0,
      blockingIssues,
      warnings: Array.from(new Set([...report.validationResult.warnings, ...standardWarnings])),
    },
    documentsCompat: {
      ...report.documentsCompat,
      document4FollowUps: followUpRows.map((row) => ({
        id: row.id,
        location: row.location,
        hazardDescription: row.hazardDescription,
        guidanceDate: row.guidanceDate,
        confirmationDate: row.confirmationDate,
        beforePhotoUrl: row.beforePhotoUrl,
        afterPhotoUrl: row.afterPhotoUrl,
        result: row.result,
        actionRequired: row.actionRequired,
      })),
    },
  });

  const nextReviewQueue = buildWorkspaceReviewQueue(nextPayload, report.reviewMeta.reviewQueue);
  const nextValidationResult = buildValidationResultWithReviewQueue(
    nextPayload,
    nextReviewQueue,
    nextPayload.validationResult,
    standardWarnings,
    blockingIssues,
  );

  return reportPayloadSchema.parse({
    ...nextPayload,
    reviewMeta: {
      ...nextPayload.reviewMeta,
      reviewQueue: nextReviewQueue,
    },
    validationResult: nextValidationResult,
  });
}

type ReportWorkspaceProps = {
  reportId: string;
  report: ReportPayload;
  record: ReportRecord;
  initialEntry?: string | null;
  initialSession?: DemoSession | null;
};

export default function ReportWorkspace({
  reportId,
  report,
  record,
  initialEntry = null,
  initialSession = null,
}: ReportWorkspaceProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const normalizedReport = normalizeReport(report);
  const [baseReport, setBaseReport] = useState<ReportPayload>(normalizedReport);
  const [workspace, setWorkspace] = useState<WorkspaceDraft>(() => buildWorkspaceDraft(normalizedReport));
  const [activeSectionId, setActiveSectionId] = useState<ReportWorkspaceSectionId>(() =>
    initialEntry === 'generated'
      ? 'section1'
      : resolveReportWorkspaceSectionId(normalizedReport.currentSection),
  );
  const [followUpRows, setFollowUpRows] = useState<FollowUpRow[]>(() => buildFollowUpRows(normalizedReport));
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [actionError, setActionError] = useState('');
  const [downloadState, setDownloadState] = useState<DownloadState>('idle');
  const [exportDisclaimerAccepted, setExportDisclaimerAccepted] = useState(
    record.exportDisclaimerAccepted,
  );
  const [disclaimerOpen, setDisclaimerOpen] = useState(false);
  const [pendingDownloadFormat, setPendingDownloadFormat] = useState<'hwpx' | 'pdf' | null>(null);
  const [pendingDownloadContext, setPendingDownloadContext] = useState<PendingDownloadContext | null>(null);
  const [typedSignatureName, setTypedSignatureName] = useState('');
  const [disclaimerError, setDisclaimerError] = useState('');
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [anonymousTokenForClaim, setAnonymousTokenForClaim] = useState<string | null>(null);
  const [reviewQueueOpen, setReviewQueueOpen] = useState(false);
  const [observationDrawerIndex, setObservationDrawerIndex] = useState<number | null>(null);

  const baseReportRef = useRef(baseReport);
  const workspaceRef = useRef(workspace);
  const followUpRowsRef = useRef(followUpRows);
  const activeSectionIdRef = useRef(activeSectionId);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savePromiseRef = useRef<Promise<void> | null>(null);
  const lastSavedSignatureRef = useRef('');
  const didMountRef = useRef(false);
  const preferredSessionRef = useRef<DemoSession | null>(initialSession);
  const handledAuthReturnRef = useRef(false);
  const handleDownloadRef = useRef<(format: 'hwpx' | 'pdf') => Promise<void>>(async () => {});

  useEffect(() => {
    baseReportRef.current = baseReport;
  }, [baseReport]);

  useEffect(() => {
    workspaceRef.current = workspace;
  }, [workspace]);

  useEffect(() => {
    followUpRowsRef.current = followUpRows;
  }, [followUpRows]);

  useEffect(() => {
    activeSectionIdRef.current = activeSectionId;
  }, [activeSectionId]);

  useEffect(() => {
    preferredSessionRef.current = initialSession;
  }, [initialSession, reportId]);

  useEffect(() => {
    const nextReport = normalizeReport(report);
    const nextWorkspace = buildWorkspaceDraft(nextReport);
    const nextFollowUps = buildFollowUpRows(nextReport);
    const nextSectionId =
      initialEntry === 'generated'
        ? 'section1'
        : resolveReportWorkspaceSectionId(nextReport.currentSection);
    const nextPersisted = buildPersistedReport(nextReport, nextWorkspace, nextFollowUps, nextSectionId);

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }

    setBaseReport(nextReport);
    setWorkspace(nextWorkspace);
    setFollowUpRows(nextFollowUps);
    setActiveSectionId(nextSectionId);
    setSaveState('idle');
    setActionError('');
    preferredSessionRef.current = initialSession;
    setExportDisclaimerAccepted(record.exportDisclaimerAccepted);
    setTypedSignatureName(record.exportDisclaimerAcceptance?.accepted_by_name ?? '');
    setDisclaimerOpen(false);
    setPendingDownloadFormat(null);
    setPendingDownloadContext(null);
    setDisclaimerError('');
    setAuthDialogOpen(false);
    setAuthBusy(false);
    setAnonymousTokenForClaim(null);
    setReviewQueueOpen(false);
    lastSavedSignatureRef.current = JSON.stringify(nextPersisted);
    didMountRef.current = false;
    handledAuthReturnRef.current = false;
  }, [
    initialEntry,
    record.exportDisclaimerAcceptance?.accepted_by_name,
    record.exportDisclaimerAccepted,
    record.localOnly,
    record.sessionMode,
    report,
    reportId,
    initialSession,
  ]);

  const activeSectionIndex = Math.max(
    0,
    reportWorkspaceSections.findIndex((section) => section.id === activeSectionId),
  );
  const activeSection = reportWorkspaceSections[activeSectionIndex] ?? reportWorkspaceSections[0];
  const section4Photos = workspace.photoEvidence.filter((photo) => photo.sourceStep === 'step2_hazard');
  const photoCount = workspace.photoEvidence.length;
  const localRecordMode = Boolean(record.localOnly);
  const progressValue =
    baseReport.status === 'exported' || baseReport.status === 'review_completed' || baseReport.status === 'draft_ready'
      ? 100
      : photoCount > 0
        ? 70
        : 30;
  const progressMeta =
    baseReport.status === 'exported'
      ? '출력 완료'
      : baseReport.status === 'draft_ready'
        ? '초안 완료'
        : photoCount > 0
          ? '사진 반영'
          : '입력 진행';
  const previewPayload = buildPersistedReport(
    baseReport,
    workspace,
    followUpRows,
    activeSectionId,
  );
  const photoObservations = previewPayload.photoObservations;
  const fieldProvenance = previewPayload.fieldProvenance;
  const selectedObservation =
    observationDrawerIndex === null ? null : photoObservations[observationDrawerIndex] ?? null;
  const aiFilledCount = fieldProvenance.filter((item) => item.source === 'AI_PHOTO').length;
  const standardMatchedCount = fieldProvenance.filter(
    (item) => item.source === 'RISK_LIBRARY' || item.source === 'RULE_TEMPLATE',
  ).length;
  const aiReviewCount = photoObservations.filter(
    (item) => item.needsHumanReview || item.reviewReasons.length > 0,
  ).length;
  const reviewQueue = previewPayload.reviewMeta.reviewQueue;
  const unresolvedReviewQueue = reviewQueue.filter((item) => !item.resolved);
  const unresolvedRequiredReviewQueue = unresolvedReviewQueue.filter(
    (item) => item.severity === 'required',
  );
  const unresolvedWarningReviewQueue = unresolvedReviewQueue.filter(
    (item) => item.severity === 'warning',
  );
  const unresolvedInfoReviewQueue = unresolvedReviewQueue.filter(
    (item) => item.severity === 'info',
  );
  const reviewSummaryMessage =
    unresolvedRequiredReviewQueue.length > 0
      ? '출력 전 확인이 필요한 필수 항목이 있습니다.'
      : unresolvedReviewQueue.length > 0
        ? '검토 권장 항목이 있습니다.'
        : '현재 확인이 필요한 항목이 없습니다.';
  const reviewSummaryTone =
    unresolvedRequiredReviewQueue.length > 0
      ? styles.reviewSummaryAccentRequired
      : unresolvedReviewQueue.length > 0
        ? styles.reviewSummaryAccentAdvisory
        : styles.reviewSummaryAccentClear;

  function getFieldProvenance(fieldPath: string): FieldProvenance | undefined {
    return fieldProvenance.find((item) => item.fieldPath === fieldPath);
  }

  function renderConfidenceBadge(fieldPath: string) {
    const provenance = getFieldProvenance(fieldPath);
    if (!provenance) {
      return null;
    }
    const label = provenanceStatusLabel(provenance);
    return (
      <span
        className={`${styles.aiBadge} ${
          provenance.needsReview
            ? styles.aiBadgeReview
            : provenance.source === 'RISK_LIBRARY' || provenance.source === 'RULE_TEMPLATE'
              ? styles.aiBadgeStandard
              : styles.aiBadgeFilled
        }`}
        title={safeText(provenance.note) || label}
      >
        {label} · {formatConfidence(provenance.confidence)}
      </span>
    );
  }

  function observationDisplayTitle(observation: PhotoObservationCard): string {
    return (
      safeText(observation.riskContext?.hazardSummary) ||
      safeText(observation.observedRiskStructured?.hazardSummary) ||
      safeText(observation.observedRisk) ||
      '사진 관찰카드'
    );
  }

  useEffect(() => {
    if (!reviewQueueOpen && observationDrawerIndex === null) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setReviewQueueOpen(false);
        setObservationDrawerIndex(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [reviewQueueOpen, observationDrawerIndex]);

  const resolveReportSession = useCallback(async (): Promise<DemoSession> => {
    const preferredSession = preferredSessionRef.current;
    const session = isLocalReportId(reportId)
      ? preferredSession
        ? await bootstrapDemoSession({ preferredSession })
        : await bootstrapDemoSession()
      : await bootstrapReportSession({ preferredSession });
    preferredSessionRef.current = session;
    return session;
  }, [reportId]);

  const shouldSuppressGuestWorkspaceError = useCallback(
    (error: unknown, session: DemoSession) => {
      if (canUseReportServerApis(session)) {
        return false;
      }
      const message = error instanceof Error ? error.message : String(error ?? '');
      return message.toLowerCase().includes('workspace access denied');
    },
    [],
  );

  const buildGoogleAuthReturnPath = useCallback(
    (format: 'hwpx' | 'pdf') => {
      const current = new URLSearchParams(searchParams.toString());
      current.delete('downloadAfterAuth');
      current.set('downloadAfterAuth', format);
      const query = current.toString();
      return `/reports/${reportId}${query ? `?${query}` : ''}`;
    },
    [reportId, searchParams],
  );

  const flushAutosave = useCallback(async (): Promise<ReportPayload> => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }

    const payload = buildPersistedReport(
      baseReportRef.current,
      workspaceRef.current,
      followUpRowsRef.current,
      activeSectionIdRef.current,
    );
    const signature = JSON.stringify(payload);

    if (signature !== lastSavedSignatureRef.current) {
      const task = (async () => {
        setSaveState('saving');
        const session = await resolveReportSession();
        try {
          const updated = await patchReportRecord(session, reportId, payload);
          const nextReport = normalizeReport(updated.payload);
          setBaseReport(nextReport);
          baseReportRef.current = nextReport;
          lastSavedSignatureRef.current = JSON.stringify(
            buildPersistedReport(
              nextReport,
              workspaceRef.current,
              followUpRowsRef.current,
              activeSectionIdRef.current,
            ),
          );
          setSaveState('saved');
        } catch (error) {
          if (shouldSuppressGuestWorkspaceError(error, session)) {
            lastSavedSignatureRef.current = signature;
            setSaveState('saved');
            return;
          }
          throw error;
        }
      })().catch((error) => {
        setSaveState('error');
        throw error;
      });

      savePromiseRef.current = task;
      try {
        await task;
      } finally {
        if (savePromiseRef.current === task) {
          savePromiseRef.current = null;
        }
      }
    } else if (savePromiseRef.current) {
      await savePromiseRef.current;
    }

    return payload;
  }, [reportId, resolveReportSession, shouldSuppressGuestWorkspaceError]);

  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    setSaveState('saving');
    saveTimerRef.current = setTimeout(() => {
      void flushAutosave().catch((error) => {
        setActionError(error instanceof Error ? error.message : '저장에 실패했습니다.');
      });
    }, 700);

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
    };
  }, [activeSectionId, flushAutosave, followUpRows, workspace]);

  useEffect(() => {
    const format = searchParams.get('downloadAfterAuth');
    if (handledAuthReturnRef.current || (format !== 'pdf' && format !== 'hwpx')) {
      return;
    }
    handledAuthReturnRef.current = true;
    router.replace(`/reports/${reportId}`);
    void handleDownloadRef.current(format);
  }, [reportId, router, searchParams]);

  function updateMetaField<K extends keyof ReportPayload['reportMeta']>(
    field: K,
    value: ReportPayload['reportMeta'][K],
  ) {
    setActionError('');
    setWorkspace((current) => ({
      ...current,
      reportMeta: {
        ...current.reportMeta,
        [field]: value,
      },
    }));
  }

  function updateDoc5Field<K extends keyof ReportPayload['sectionDrafts']['doc5']>(
    field: K,
    value: ReportPayload['sectionDrafts']['doc5'][K],
  ) {
    setActionError('');
    setWorkspace((current) => ({
      ...current,
      sectionDrafts: {
        ...current.sectionDrafts,
        doc5: {
          ...current.sectionDrafts.doc5,
          [field]: value,
        },
      },
    }));
  }

  function updateFindingField<K extends keyof ReportPayload['findingCandidates'][number]>(
    index: number,
    field: K,
    value: ReportPayload['findingCandidates'][number][K],
  ) {
    setActionError('');
    setWorkspace((current) => ({
      ...current,
      findingCandidates: current.findingCandidates.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    }));
  }

  function updatePlanField<K extends keyof ReportPayload['sectionDrafts']['doc8'][number]>(
    index: number,
    field: K,
    value: ReportPayload['sectionDrafts']['doc8'][number][K],
  ) {
    setActionError('');
    setWorkspace((current) => ({
      ...current,
      sectionDrafts: {
        ...current.sectionDrafts,
        doc8: current.sectionDrafts.doc8.map((item, itemIndex) =>
          itemIndex === index ? { ...item, [field]: value } : item,
        ),
      },
    }));
  }

  function updateDoc11Field<K extends keyof ReportPayload['sectionDrafts']['doc11'][number]>(
    index: number,
    field: K,
    value: ReportPayload['sectionDrafts']['doc11'][number][K],
  ) {
    setActionError('');
    setWorkspace((current) => ({
      ...current,
      sectionDrafts: {
        ...current.sectionDrafts,
        doc11: current.sectionDrafts.doc11.map((item, itemIndex) =>
          itemIndex === index ? { ...item, [field]: value } : item,
        ),
      },
    }));
  }

  function updateDoc12Field<K extends keyof ReportPayload['sectionDrafts']['doc12'][number]>(
    index: number,
    field: K,
    value: ReportPayload['sectionDrafts']['doc12'][number][K],
  ) {
    setActionError('');
    setWorkspace((current) => ({
      ...current,
      sectionDrafts: {
        ...current.sectionDrafts,
        doc12: current.sectionDrafts.doc12.map((item, itemIndex) =>
          itemIndex === index ? { ...item, [field]: value } : item,
        ),
      },
    }));
  }

  function updateDoc14Field<K extends keyof ReportPayload['sectionDrafts']['doc14']>(
    field: K,
    value: ReportPayload['sectionDrafts']['doc14'][K],
  ) {
    setActionError('');
    setWorkspace((current) => ({
      ...current,
      sectionDrafts: {
        ...current.sectionDrafts,
        doc14: {
          ...current.sectionDrafts.doc14,
          [field]: value,
        },
      },
    }));
  }

  function toggleReviewItemResolved(fieldPath: string) {
    setActionError('');
    setBaseReport((current) => ({
      ...current,
      reviewMeta: {
        ...current.reviewMeta,
        reviewQueue: current.reviewMeta.reviewQueue.map((item) =>
          item.fieldPath === fieldPath
            ? {
                ...item,
                resolved: !item.resolved,
                status: !item.resolved ? 'reviewed' : 'pending',
                needsReview: item.resolved,
              }
            : item,
        ),
      },
    }));
  }

  function jumpToReviewItem(item: ReviewQueueItem) {
    const fieldPath = item.fieldPath;
    if (fieldPath.startsWith('findingCandidates[')) {
      setActiveSectionId('section4');
      return;
    }
    if (fieldPath.startsWith('sectionDrafts.doc8[') || fieldPath.startsWith('photoStepBuckets.step1_overview')) {
      setActiveSectionId('section5');
      return;
    }
    if (fieldPath.startsWith('photoStepBuckets.step2_hazard') || fieldPath.startsWith('photoObservations[')) {
      setActiveSectionId('section4');
      return;
    }
    if (fieldPath.startsWith('reportMeta.site') || fieldPath.startsWith('reportMeta.customer')) {
      setActiveSectionId('section1');
      return;
    }
    if (fieldPath.startsWith('reportMeta.') || fieldPath.startsWith('dispatch.')) {
      setActiveSectionId('section2');
      return;
    }
  }

  function addFollowUpRow() {
    setActionError('');
    setFollowUpRows((current) => [
      ...current,
      {
        id: `follow-up-${current.length + 1}`,
        location: '',
        hazardDescription: '',
        actionRequired: '',
        result: '확인 필요',
        guidanceDate: '',
        confirmationDate: workspace.reportMeta.visitDate,
        beforePhotoUrl: '',
        afterPhotoUrl: '',
      },
    ]);
  }

  function updateFollowUpRow<K extends keyof FollowUpRow>(
    id: string,
    field: K,
    value: FollowUpRow[K],
  ) {
    setActionError('');
    setFollowUpRows((current) =>
      current.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  }

  function addFinding() {
    setActionError('');
    setWorkspace((current) => ({
      ...current,
      findingCandidates: [...current.findingCandidates, { ...EMPTY_FINDING }],
    }));
  }

  function addPlan() {
    setActionError('');
    setWorkspace((current) => ({
      ...current,
      sectionDrafts: {
        ...current.sectionDrafts,
        doc8: [...current.sectionDrafts.doc8, { ...EMPTY_PLAN }],
      },
    }));
  }

  function moveSection(direction: -1 | 1) {
    const nextIndex = Math.min(
      reportWorkspaceSections.length - 1,
      Math.max(0, activeSectionIndex + direction),
    );
    setActiveSectionId(reportWorkspaceSections[nextIndex]!.id);
  }

  async function performDownload(
    format: 'hwpx' | 'pdf',
    exportPayload: {
      acknowledge_ai_disclaimer: boolean;
      typed_signature_name: string;
    },
    context?: PendingDownloadContext,
  ) {
    setActionError('');
    setDownloadState(format);

    try {
      const targetReportId = context?.targetReportId ?? reportId;
      const payload = context?.payloadOverride ?? (await flushAutosave());
      const session = mapReportPayloadToInspectionSession(targetReportId, payload);
      const file =
        format === 'hwpx'
          ? await fetchInspectionHwpxDocument(session)
          : await fetchInspectionPdfDocument(session);

      saveBlobAsFile(file.blob, file.filename);

      const reportSession = context?.reportSession ?? (await resolveReportSession());
      preferredSessionRef.current = reportSession;
      await markReportReviewComplete(reportSession, targetReportId);
      const updated = await registerReportExport(reportSession, targetReportId, format, {
        confirm_reviewed: true,
        acknowledge_ai_disclaimer: exportPayload.acknowledge_ai_disclaimer,
        typed_signature_name: exportPayload.typed_signature_name,
      });
      const nextReport = normalizeReport(updated.payload);
      setBaseReport(nextReport);
      setExportDisclaimerAccepted(updated.exportDisclaimerAccepted);
      setTypedSignatureName(updated.exportDisclaimerAcceptance?.accepted_by_name ?? exportPayload.typed_signature_name);
      baseReportRef.current = nextReport;
      lastSavedSignatureRef.current = JSON.stringify(
        buildPersistedReport(nextReport, workspaceRef.current, followUpRowsRef.current, activeSectionIdRef.current),
      );
      setSaveState('saved');
      if (targetReportId !== reportId) {
        router.replace(`/reports/${targetReportId}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '문서 다운로드에 실패했습니다.';
      if (
        format === 'pdf' &&
        (message.includes('HWPX_PDF_API_KEY') ||
          message.includes('Remote HWPX PDF converter is required outside Windows') ||
          message.includes('only available on Windows'))
      ) {
        setActionError(`PDF 변환기 설정 필요: ${message}`);
      } else {
        setActionError(message);
      }
    } finally {
      setDownloadState('idle');
    }
  }

  function openDisclaimer(
    format: 'hwpx' | 'pdf',
    context: PendingDownloadContext,
  ) {
    setPendingDownloadFormat(format);
    setPendingDownloadContext(context);
    setDisclaimerError('');
    setDisclaimerOpen(true);
  }

  function openAccountDialog(format: 'hwpx' | 'pdf', anonymousToken: string | null) {
    setPendingDownloadFormat(format);
    setPendingDownloadContext(null);
    setAnonymousTokenForClaim(anonymousToken);
    setActionError('');
    setAuthDialogOpen(true);
  }

  async function handleDownload(format: 'hwpx' | 'pdf') {
    const exportPreviewPayload = buildPersistedReport(
      baseReportRef.current,
      workspaceRef.current,
      followUpRowsRef.current,
      activeSectionIdRef.current,
    );
    const unresolvedRequired = exportPreviewPayload.reviewMeta.reviewQueue.filter(
      (item) => item.severity === 'required' && !item.resolved,
    );
    const blockingIssues = exportPreviewPayload.validationResult.blockingIssues.filter((item) =>
      safeText(item),
    );
    if (unresolvedRequired.length > 0 || blockingIssues.length > 0) {
      const warningLines = [
        ...unresolvedRequired.slice(0, 5).map((item) => `- ${item.label}`),
        ...blockingIssues.slice(0, 5).map((item) => `- ${item}`),
      ];
      setActionError(
        `${unresolvedRequired.length > 0 ? `필수 검토 항목 ${unresolvedRequired.length}개` : '출력 전 확인 항목'}가 남아 있습니다.\n\n${warningLines.join('\n')}\n\n필수 검토 항목을 확인한 뒤 다시 다운로드해 주세요.`,
      );
      return;
    }

    const currentSession = await resolveReportSession();
    preferredSessionRef.current = currentSession;

    if (!isAuthenticatedSession(currentSession)) {
      openAccountDialog(
        format,
        currentSession.mode === 'anonymous' ? currentSession.token : null,
      );
      return;
    }

    let context: PendingDownloadContext = {
      reportSession: currentSession,
      targetReportId: reportId,
    };

    if (localRecordMode) {
      const payload = await flushAutosave();
      const syncedRecord = await syncLocalReportToServer(currentSession, {
        ...record,
        status: payload.status,
        payload,
        updated_at: payload.updatedAt,
      });
      await removeLocalReport(reportId);
      const nextReport = normalizeReport(syncedRecord.payload);
      setBaseReport(nextReport);
      baseReportRef.current = nextReport;
      context = {
        reportSession: currentSession,
        targetReportId: syncedRecord.id,
        payloadOverride: syncedRecord.payload,
      };
    }

    if (!exportDisclaimerAccepted) {
      openDisclaimer(format, context);
      return;
    }

    await performDownload(format, {
      acknowledge_ai_disclaimer: false,
      typed_signature_name: typedSignatureName,
    }, context);
  }

  useEffect(() => {
    handleDownloadRef.current = handleDownload;
  });

  async function handleDisclaimerConfirm() {
    const signature = typedSignatureName.trim();
    if (!pendingDownloadFormat) {
      setDisclaimerOpen(false);
      return;
    }
    if (!signature) {
      setDisclaimerError('성함 또는 서명명을 입력해 주세요.');
      return;
    }

    setDisclaimerError('');
    setDisclaimerOpen(false);
    await performDownload(pendingDownloadFormat, {
      acknowledge_ai_disclaimer: true,
      typed_signature_name: signature,
    }, pendingDownloadContext ?? undefined);
    setPendingDownloadFormat(null);
    setPendingDownloadContext(null);
  }

  async function handleAccountConfirm() {
    const format = pendingDownloadFormat;
    if (!format) {
      setAuthDialogOpen(false);
      return;
    }

    setAuthBusy(true);

    try {
      await beginGoogleWorkspaceAuth({
        anonymousToken: anonymousTokenForClaim,
        nextPath: buildGoogleAuthReturnPath(format),
      });
    } catch (error) {
      setActionError(error instanceof Error ? error.message : '구글 로그인으로 이동하지 못했습니다.');
    } finally {
      setAuthBusy(false);
    }
  }

  function renderAiStatusPanel() {
    return (
      <section className={`erp-panel ${styles.aiStatusPanel}`}>
        <div className={styles.aiStatusHeader}>
          <div>
            <span className={styles.editorEyebrow}>AI Fill Status</span>
            <h2 className={styles.reviewPanelTitle}>사진 기반 AI 표준화 결과</h2>
            <p className={styles.reviewPanelSummary}>
              관찰카드, 표준 위험 매칭, 확인 필요 사유를 한 곳에서 점검합니다.
            </p>
          </div>
          <div className={styles.aiMetricGrid}>
            <div>
              <span>관찰카드</span>
              <strong>{photoObservations.length}</strong>
            </div>
            <div>
              <span>AI 채움</span>
              <strong>{aiFilledCount}</strong>
            </div>
            <div>
              <span>표준 매칭</span>
              <strong>{standardMatchedCount}</strong>
            </div>
            <div>
              <span>확인 필요</span>
              <strong>{aiReviewCount}</strong>
            </div>
          </div>
        </div>

        {photoObservations.length === 0 ? (
          <div className={styles.aiEmptyState}>
            아직 사진 관찰카드가 없습니다. `/reports/new`에서 필수 사진을 업로드한 뒤 AI 초안을 생성해 주세요.
          </div>
        ) : (
          <div className={styles.aiObservationList}>
            {photoObservations.slice(0, 4).map((observation, index) => (
              <article key={observation.id || observation.photoAssetId} className={styles.aiObservationCard}>
                <div>
                  <span className={styles.aiObservationRole}>
                    {observation.photoRole === 'step2_hazard' ? '위험요인 사진' : '전경/공정 사진'}
                  </span>
                  <strong>{observationDisplayTitle(observation)}</strong>
                  <p>
                    {safeText(observation.workContext?.summary) ||
                      safeText(observation.observedProcess) ||
                      '공정 맥락 확인 필요'}
                  </p>
                </div>
                <div className={styles.aiObservationMeta}>
                  <span>{formatConfidence(observation.confidence)}</span>
                  <span>{observation.needsHumanReview ? '확인 필요' : '검토 완료 가능'}</span>
                </div>
                <button
                  type="button"
                  className="erp-button erp-button-secondary"
                  onClick={() => setObservationDrawerIndex(index)}
                >
                  근거 보기
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
    );
  }

  function renderSection1() {
    return (
      <div className={styles.documentStack}>
        <div className={styles.sheetGrid}>
          <section className={styles.sheetBlock}>
            <div className={styles.blockHeader}>
              <h3 className={styles.blockTitle}>1. 기술지도 대상사업장</h3>
            </div>
            <div className={styles.formTable}>
              <label className={styles.formRow}>
                <span className={styles.formLabel}>사업장관리번호</span>
                <input
                  className={styles.inputControl}
                  value={safeText(workspace.reportMeta.siteManagementNumber)}
                  onChange={(event) => updateMetaField('siteManagementNumber', event.target.value)}
                />
              </label>
              <label className={styles.formRow}>
                <span className={styles.formLabel}>사업개시번호</span>
                <input
                  className={styles.inputControl}
                  value={safeText(workspace.reportMeta.businessStartNumber)}
                  onChange={(event) => updateMetaField('businessStartNumber', event.target.value)}
                />
              </label>
              <label className={styles.formRow}>
                <span className={styles.formLabel}>현장명</span>
                <input
                  className={styles.inputControl}
                  value={safeText(workspace.reportMeta.siteName)}
                  onChange={(event) => updateMetaField('siteName', event.target.value)}
                />
              </label>
              <label className={styles.formRow}>
                <span className={styles.formLabel}>현장 주소</span>
                <input
                  className={styles.inputControl}
                  value={safeText(workspace.reportMeta.siteAddress)}
                  onChange={(event) => updateMetaField('siteAddress', event.target.value)}
                  placeholder="현장 주소"
                />
              </label>
              <label className={styles.formRow}>
                <span className={styles.formLabel}>현장 책임자 연락처</span>
                <input
                  className={styles.inputControl}
                  value={safeText(workspace.reportMeta.siteContact)}
                  onChange={(event) => updateMetaField('siteContact', event.target.value)}
                  placeholder="담당자 연락처"
                />
              </label>
              <label className={styles.formRow}>
                <span className={styles.formLabel}>공사기간</span>
                <input
                  className={styles.inputControl}
                  value={safeText(workspace.reportMeta.constructionPeriod)}
                  onChange={(event) => updateMetaField('constructionPeriod', event.target.value)}
                />
              </label>
              <label className={styles.formRow}>
                <span className={styles.formLabel}>공사금액</span>
                <input
                  className={styles.inputControl}
                  value={safeText(workspace.reportMeta.constructionAmount)}
                  onChange={(event) => updateMetaField('constructionAmount', event.target.value)}
                />
              </label>
              <label className={styles.formRow}>
                <span className={styles.formLabel}>출역인원</span>
                <input
                  className={styles.inputControl}
                  value={safeText(workspace.reportMeta.workerCount)}
                  onChange={(event) => updateMetaField('workerCount', event.target.value)}
                />
              </label>
            </div>
          </section>

          <section className={styles.sheetBlock}>
            <div className={styles.blockHeader}>
              <h3 className={styles.blockTitle}>사업주 및 본사 정보</h3>
            </div>
            <div className={styles.formTable}>
              <label className={styles.formRow}>
                <span className={styles.formLabel}>시공사 / 고객사</span>
                <input
                  className={styles.inputControl}
                  value={safeText(workspace.reportMeta.customerName)}
                  onChange={(event) => updateMetaField('customerName', event.target.value)}
                />
              </label>
              <label className={styles.formRow}>
                <span className={styles.formLabel}>지도기관</span>
                <input
                  className={styles.inputControl}
                  value={safeText(workspace.reportMeta.guidanceAgencyName)}
                  onChange={(event) => updateMetaField('guidanceAgencyName', event.target.value)}
                />
              </label>
              <label className={styles.formRow}>
                <span className={styles.formLabel}>현장 책임자</span>
                <input
                  className={styles.inputControl}
                  value={safeText(workspace.reportMeta.siteManagerName)}
                  onChange={(event) => updateMetaField('siteManagerName', event.target.value)}
                />
              </label>
              <label className={styles.formRow}>
                <span className={styles.formLabel}>법인등록번호</span>
                <input
                  className={styles.inputControl}
                  value={safeText(workspace.reportMeta.corporationRegistrationNumber)}
                  onChange={(event) =>
                    updateMetaField('corporationRegistrationNumber', event.target.value)
                  }
                />
              </label>
              <label className={styles.formRow}>
                <span className={styles.formLabel}>사업자등록번호</span>
                <input
                  className={styles.inputControl}
                  value={safeText(workspace.reportMeta.businessRegistrationNumber)}
                  onChange={(event) =>
                    updateMetaField('businessRegistrationNumber', event.target.value)
                  }
                />
              </label>
              <label className={styles.formRow}>
                <span className={styles.formLabel}>면허번호</span>
                <input
                  className={styles.inputControl}
                  value={safeText(workspace.reportMeta.licenseNumber)}
                  onChange={(event) => updateMetaField('licenseNumber', event.target.value)}
                />
              </label>
              <label className={styles.formRow}>
                <span className={styles.formLabel}>본사 연락처</span>
                <input
                  className={styles.inputControl}
                  value={safeText(workspace.reportMeta.headquartersContact)}
                  onChange={(event) => updateMetaField('headquartersContact', event.target.value)}
                />
              </label>
              <label className={styles.formRow}>
                <span className={styles.formLabel}>본사 주소</span>
                <input
                  className={styles.inputControl}
                  value={safeText(workspace.reportMeta.headquartersAddress)}
                  onChange={(event) => updateMetaField('headquartersAddress', event.target.value)}
                />
              </label>
              <label className={styles.formRow}>
                <span className={styles.formLabel}>작성자</span>
                <input
                  className={styles.inputControl}
                  value={safeText(workspace.reportMeta.drafterName)}
                  onChange={(event) => updateMetaField('drafterName', event.target.value)}
                />
              </label>
            </div>
          </section>
        </div>
      </div>
    );
  }

  function renderSection2() {
    return (
      <div className={styles.documentStack}>
        <div className={styles.sheetGrid}>
          <section className={styles.sheetBlock}>
            <div className={styles.blockHeader}>
              <h3 className={styles.blockTitle}>2. 기술지도 개요</h3>
            </div>
            <div className={styles.formTable}>
              <label className={styles.formRow}>
                <span className={styles.formLabel}>지도일</span>
                <input
                  className={styles.inputControl}
                  value={safeText(workspace.reportMeta.visitDate)}
                  onChange={(event) => updateMetaField('visitDate', event.target.value)}
                />
              </label>
              <label className={styles.formRow}>
                <span className={styles.formLabel}>지도 회차</span>
                <div className={styles.inlineGrid}>
                  <input
                    className={styles.inputControl}
                    value={safeText(workspace.reportMeta.visitCount)}
                    onChange={(event) => updateMetaField('visitCount', event.target.value)}
                    placeholder="회차"
                  />
                  <input
                    className={styles.inputControl}
                    value={safeText(workspace.reportMeta.totalVisitCount)}
                    onChange={(event) => updateMetaField('totalVisitCount', event.target.value)}
                    placeholder="총 회"
                  />
                </div>
              </label>
              <label className={styles.formRow}>
                <span className={styles.formLabel}>공정률</span>
                <input
                  className={styles.inputControl}
                  value={safeText(workspace.reportMeta.progressRate)}
                  onChange={(event) => updateMetaField('progressRate', event.target.value)}
                />
              </label>
              <label className={styles.formRow}>
                <span className={styles.formLabel}>공사 종류</span>
                <input
                  className={styles.inputControl}
                  value={safeText(workspace.reportMeta.constructionType)}
                  onChange={(event) => updateMetaField('constructionType', event.target.value)}
                  placeholder="건설 / 전기·정보통신"
                />
              </label>
              <label className={styles.formRow}>
                <span className={styles.formLabel}>통보 방법</span>
                <select
                  className={styles.selectControl}
                  value={workspace.reportMeta.notificationMethod}
                  onChange={(event) =>
                    updateMetaField(
                      'notificationMethod',
                      event.target.value as ReportPayload['reportMeta']['notificationMethod'],
                    )
                  }
                >
                  {NOTIFICATION_METHOD_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className={styles.formRow}>
                <span className={styles.formLabel}>이전 기술지도 이행여부</span>
                <select
                  className={styles.selectControl}
                  value={workspace.reportMeta.previousImplementationStatus}
                  onChange={(event) =>
                    updateMetaField(
                      'previousImplementationStatus',
                      event.target
                        .value as ReportPayload['reportMeta']['previousImplementationStatus'],
                    )
                  }
                >
                  {PREVIOUS_IMPLEMENTATION_STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          <section className={styles.sheetBlock}>
            <div className={styles.blockHeader}>
              <h3 className={styles.blockTitle}>통보 및 특이사항</h3>
            </div>
            <div className={styles.formStack}>
              <label className={styles.formStackRow}>
                <span className={styles.formLabel}>직접전달 성함</span>
                <input
                  className={styles.inputControl}
                  value={safeText(workspace.reportMeta.notificationRecipientName)}
                  onChange={(event) =>
                    updateMetaField('notificationRecipientName', event.target.value)
                  }
                />
              </label>
              <label className={styles.formStackRow}>
                <span className={styles.formLabel}>기타 통보방법</span>
                <input
                  className={styles.inputControl}
                  value={safeText(workspace.reportMeta.otherNotificationMethod)}
                  onChange={(event) => updateMetaField('otherNotificationMethod', event.target.value)}
                />
              </label>
              <label className={styles.formStackRow}>
                <span className={styles.formLabel}>현재 공정</span>
                <textarea
                  className={styles.textareaControl}
                  value={safeText(workspace.reportMeta.processSummary)}
                  onChange={(event) => updateMetaField('processSummary', event.target.value)}
                />
              </label>
              <label className={styles.formStackRow}>
                <span className={styles.formLabel}>특이사항</span>
                <textarea
                  className={`${styles.textareaControl} ${styles.textareaTall}`}
                  value={safeText(workspace.sectionDrafts.doc5.accidentTrend)}
                  onChange={(event) => updateDoc5Field('accidentTrend', event.target.value)}
                />
              </label>
            </div>
          </section>
        </div>
      </div>
    );
  }

  function renderSection3() {
    return (
      <div className={styles.documentStack}>
        <div className={styles.sectionActionRow}>
          <div>
            <h3 className={styles.blockTitle}>3. 이전 기술지도 사항 이행여부</h3>
          </div>
          <button type="button" className="erp-button erp-button-secondary" onClick={addFollowUpRow}>
            항목 추가
          </button>
        </div>

        <div className={styles.repeatList}>
          {followUpRows.map((row, index) => (
            <article key={row.id} className={styles.repeatCard}>
              <div className={styles.repeatHeader}>
                <div className={styles.repeatBadge}>{index + 1}</div>
                <div>
                  <strong>이전 지도사항 {index + 1}</strong>
                </div>
              </div>

              <div className={styles.repeatBody}>
                <div className={styles.photoPlaceholderGrid}>
                  <div className={styles.photoPlaceholder}>
                    <span className={styles.photoPlaceholderLabel}>시정 전 사진</span>
                    <div className={styles.photoPlaceholderFrame}>
                      {row.beforePhotoUrl ? '저장됨' : '이미지 없음'}
                    </div>
                  </div>
                  <div className={styles.photoPlaceholder}>
                    <span className={styles.photoPlaceholderLabel}>시정 후 사진</span>
                    <div className={styles.photoPlaceholderFrame}>
                      {row.afterPhotoUrl ? '저장됨' : '이미지 없음'}
                    </div>
                  </div>
                </div>

                <div className={styles.formStack}>
                  <label className={styles.formStackRow}>
                    <span className={styles.formLabel}>유해·위험장소</span>
                    <input
                      className={styles.inputControl}
                      value={safeText(row.location)}
                      onChange={(event) => updateFollowUpRow(row.id, 'location', event.target.value)}
                    />
                  </label>
                  <label className={styles.formStackRow}>
                    <span className={styles.formLabel}>유해·위험요인</span>
                    <textarea
                      className={styles.textareaControl}
                      value={safeText(row.hazardDescription)}
                      onChange={(event) =>
                        updateFollowUpRow(row.id, 'hazardDescription', event.target.value)
                      }
                    />
                  </label>
                  <label className={styles.formStackRow}>
                    <span className={styles.formLabel}>조치 필요사항</span>
                    <textarea
                      className={styles.textareaControl}
                      value={safeText(row.actionRequired)}
                      onChange={(event) => updateFollowUpRow(row.id, 'actionRequired', event.target.value)}
                    />
                  </label>
                  <div className={styles.inlineGrid}>
                    <label className={styles.formStackRow}>
                      <span className={styles.formLabel}>이행 상태</span>
                      <select
                        className={styles.selectControl}
                        value={row.result}
                        onChange={(event) =>
                          updateFollowUpRow(row.id, 'result', event.target.value as FollowUpRow['result'])
                        }
                      >
                        <option value="이행">이행</option>
                        <option value="미이행">미이행</option>
                        <option value="확인 필요">확인 필요</option>
                      </select>
                    </label>
                    <label className={styles.formStackRow}>
                      <span className={styles.formLabel}>지도일자</span>
                      <input
                        className={styles.inputControl}
                        value={safeText(row.guidanceDate)}
                        onChange={(event) => updateFollowUpRow(row.id, 'guidanceDate', event.target.value)}
                      />
                    </label>
                    <label className={styles.formStackRow}>
                      <span className={styles.formLabel}>확인일</span>
                      <input
                        className={styles.inputControl}
                        value={safeText(row.confirmationDate)}
                        onChange={(event) => updateFollowUpRow(row.id, 'confirmationDate', event.target.value)}
                      />
                    </label>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    );
  }

  function renderSection4() {
    return (
      <div className={styles.documentStack}>
        <section className={styles.sheetBlock}>
          <div className={styles.blockHeader}>
            <h3 className={styles.blockTitle}>4. 현재 공정 내 현존하는 위험성 제거</h3>
          </div>
          <div className={styles.formStack}>
            <label className={styles.formStackRow}>
              <span className={styles.formLabel}>현재 공정 개요</span>
              <textarea
                className={styles.textareaControl}
                value={safeText(workspace.sectionDrafts.doc5.progressOverview)}
                onChange={(event) => updateDoc5Field('progressOverview', event.target.value)}
              />
            </label>
            <label className={styles.formStackRow}>
              <span className={styles.formLabel}>작업환경 위험 총평</span>
              <textarea
                className={styles.textareaControl}
                value={safeText(workspace.sectionDrafts.doc5.workEnvironmentRisk)}
                onChange={(event) => updateDoc5Field('workEnvironmentRisk', event.target.value)}
              />
            </label>
            <label className={styles.formStackRow}>
              <span className={styles.formLabel}>주요 지적 사례</span>
              <textarea
                className={styles.textareaControl}
                value={safeText(workspace.sectionDrafts.doc5.findingCase)}
                onChange={(event) => updateDoc5Field('findingCase', event.target.value)}
              />
            </label>
          </div>
        </section>

        <div className={styles.sectionActionRow}>
          <div>
            <h3 className={styles.blockTitle}>세부 지적사항</h3>
          </div>
          <button type="button" className="erp-button erp-button-secondary" onClick={addFinding}>
            지적 추가
          </button>
        </div>

        <div className={styles.findingList}>
          {workspace.findingCandidates.map((finding, index) => {
            const linkedPhotos = section4Photos.filter((photo) =>
              finding.linkedPhotoIds.includes(photo.photoAssetId),
            );

            return (
              <article key={`finding-${index}`} className={styles.findingCard}>
                <div className={styles.findingHeader}>
                  <div className={styles.findingHeaderMain}>
                    <span className={styles.findingIndex}>지적 {index + 1}</span>
                    <strong className={styles.findingTitle}>
                      {safeText(finding.location) || `현재 위험요인 ${index + 1}`}
                    </strong>
                  </div>
                  <label className={styles.findingRisk}>
                    <span className={styles.formLabel}>위험등급</span>
                    <select
                      className={styles.selectControl}
                      value={finding.riskLevel}
                      onChange={(event) =>
                        updateFindingField(
                          index,
                          'riskLevel',
                          event.target.value as ReportPayload['findingCandidates'][number]['riskLevel'],
                        )
                      }
                    >
                      <option value="상">상</option>
                      <option value="중">중</option>
                      <option value="하">하</option>
                    </select>
                  </label>
                </div>

                {linkedPhotos.length > 0 ? (
                  <div className={styles.evidenceStrip}>
                    {linkedPhotos.map((photo) => (
                      <article key={photo.photoAssetId} className={styles.evidenceCard}>
                        <div className={styles.evidenceFrame}>
                          <Image
                            src={photo.imageUrl || buildPreview('근거 사진', safeText(photo.locationHint))}
                            alt={safeText(photo.locationHint) || '근거 사진'}
                            fill
                            className={styles.evidenceImage}
                          />
                        </div>
                        <div className={styles.evidenceText}>
                          <strong>{safeText(photo.locationHint) || safeText(photo.filename) || '근거 사진'}</strong>
                          <span>{photo.hazardSignals.join(', ') || '위험 근거 정리 대기'}</span>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className={styles.subtleNotice}>근거 사진 없음</div>
                )}

                <div className={styles.fieldGrid}>
                  <label className={styles.formStackRow}>
                    <span className={styles.formLabel}>유해·위험장소</span>
                    <input
                      className={styles.inputControl}
                      value={safeText(finding.location)}
                      onChange={(event) => updateFindingField(index, 'location', event.target.value)}
                    />
                  </label>
                  <label className={styles.formStackRow}>
                    <span className={styles.formLabel}>재해형태</span>
                    <input
                      className={styles.inputControl}
                      value={safeText(finding.accidentType)}
                      onChange={(event) => updateFindingField(index, 'accidentType', event.target.value)}
                    />
                  </label>
                  <label className={styles.formStackRow}>
                    <span className={styles.formLabel}>기인물</span>
                    <input
                      className={styles.inputControl}
                      value={safeText(finding.causativeAgentKey)}
                      onChange={(event) => updateFindingField(index, 'causativeAgentKey', event.target.value)}
                    />
                  </label>
                  <label className={`${styles.formStackRow} ${styles.fieldSpan}`}>
                    <span className={styles.formLabel}>
                      유해·위험요인
                      {renderConfidenceBadge(`findingCandidates[${index}].hazardDescription`)}
                    </span>
                    <textarea
                      className={styles.textareaControl}
                      value={safeText(finding.hazardDescription)}
                      onChange={(event) => updateFindingField(index, 'hazardDescription', event.target.value)}
                    />
                  </label>
                  <label className={`${styles.formStackRow} ${styles.fieldSpan}`}>
                    <span className={styles.formLabel}>
                      지적사항 / 개선요청
                      {renderConfidenceBadge(`findingCandidates[${index}].improvementPlan`)}
                    </span>
                    <textarea
                      className={`${styles.textareaControl} ${styles.textareaTall}`}
                      value={safeText(finding.improvementPlan)}
                      onChange={(event) => updateFindingField(index, 'improvementPlan', event.target.value)}
                    />
                  </label>
                  <label className={`${styles.formStackRow} ${styles.fieldSpan}`}>
                    <span className={styles.formLabel}>비고</span>
                    <textarea
                      className={styles.textareaControl}
                      value={safeText(finding.emphasis)}
                      onChange={(event) => updateFindingField(index, 'emphasis', event.target.value)}
                    />
                  </label>
                </div>

                {finding.legalReferenceCandidates.length > 0 ||
                finding.referenceMaterialCandidates.length > 0 ? (
                  <div className={styles.referenceStrip}>
                    {finding.legalReferenceCandidates.map((item) => (
                      <span key={item} className={styles.referenceChip}>
                        법령 {item}
                      </span>
                    ))}
                    {finding.referenceMaterialCandidates.map((item) => (
                      <span key={item} className={styles.referenceChip}>
                        참고 {item}
                      </span>
                    ))}
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      </div>
    );
  }

  function renderSection5() {
    return (
      <div className={styles.documentStack}>
        <section className={styles.sheetBlock}>
          <div className={styles.blockHeader}>
            <h3 className={styles.blockTitle}>5. 향후 진행공정에 대한 유해·위험 요인 파악 및 대책</h3>
          </div>
          <label className={styles.formStackRow}>
            <span className={styles.formLabel}>향후 공정 중점</span>
            <textarea
              className={styles.textareaControl}
              value={safeText(workspace.sectionDrafts.doc5.futureProcessFocus)}
              onChange={(event) => updateDoc5Field('futureProcessFocus', event.target.value)}
            />
          </label>
        </section>

        <div className={styles.sectionActionRow}>
          <div>
            <h3 className={styles.blockTitle}>향후 공정별 위험요인 및 대책</h3>
          </div>
          <button type="button" className="erp-button erp-button-secondary" onClick={addPlan}>
            공정 추가
          </button>
        </div>

        <div className={styles.planTable}>
          <div className={styles.planHead}>
            <span>진행공정</span>
            <span>유해·위험요인</span>
            <span>예방대책</span>
            <span>비고</span>
          </div>
          {workspace.sectionDrafts.doc8.map((plan, index) => (
            <div key={`plan-${index}`} className={styles.planRow}>
              <div className={styles.planFieldStack}>
                <input
                  className={styles.inputControl}
                  value={safeText(plan.processName)}
                  onChange={(event) => updatePlanField(index, 'processName', event.target.value)}
                />
              </div>
              <div className={styles.planFieldStack}>
                {renderConfidenceBadge(`sectionDrafts.doc8[${index}].hazard`)}
                <textarea
                  className={`${styles.textareaControl} ${styles.textareaTall}`}
                  value={safeText(plan.hazard)}
                  onChange={(event) => updatePlanField(index, 'hazard', event.target.value)}
                />
              </div>
              <div className={styles.planFieldStack}>
                {renderConfidenceBadge(`sectionDrafts.doc8[${index}].countermeasure`)}
                <textarea
                  className={`${styles.textareaControl} ${styles.textareaTall}`}
                  value={safeText(plan.countermeasure)}
                  onChange={(event) => updatePlanField(index, 'countermeasure', event.target.value)}
                />
              </div>
              <div className={styles.planFieldStack}>
                <textarea
                  className={`${styles.textareaControl} ${styles.textareaTall}`}
                  value={safeText(plan.note)}
                  onChange={(event) => updatePlanField(index, 'note', event.target.value)}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function renderSection6() {
    const education = workspace.sectionDrafts.doc11[0] ?? EMPTY_EDUCATION;
    const support = workspace.sectionDrafts.doc12[0] ?? EMPTY_SUPPORT;

    return (
      <div className={styles.documentStack}>
        <div className={styles.sheetGrid}>
          <section className={styles.sheetBlock}>
            <div className={styles.blockHeader}>
              <h3 className={styles.blockTitle}>6. 사업장 지원 사항 등 기타 사항</h3>
            </div>
            <div className={styles.formTable}>
              <label className={styles.formRow}>
                <span className={styles.formLabel}>교육</span>
                <input
                  className={styles.inputControl}
                  value={safeText(education.topic)}
                  onChange={(event) => updateDoc11Field(0, 'topic', event.target.value)}
                />
              </label>
              <label className={styles.formRow}>
                <span className={styles.formLabel}>참석인원</span>
                <input
                  className={styles.inputControl}
                  value={safeText(education.attendeeCount)}
                  onChange={(event) => updateDoc11Field(0, 'attendeeCount', event.target.value)}
                />
              </label>
              <label className={`${styles.formRow} ${styles.formRowTall}`}>
                <span className={styles.formLabel}>
                  교육내용
                  {renderConfidenceBadge('sectionDrafts.doc11[0].content')}
                </span>
                <textarea
                  className={styles.textareaControl}
                  value={safeText(education.content)}
                  onChange={(event) => updateDoc11Field(0, 'content', event.target.value)}
                />
              </label>
              <label className={styles.formRow}>
                <span className={styles.formLabel}>보급한 교육자료</span>
                <input
                  className={styles.inputControl}
                  value={safeText(support.activityType)}
                  onChange={(event) => updateDoc12Field(0, 'activityType', event.target.value)}
                />
              </label>
              <label className={`${styles.formRow} ${styles.formRowTall}`}>
                <span className={styles.formLabel}>
                  지원사항
                  {renderConfidenceBadge('sectionDrafts.doc12[0].content')}
                </span>
                <textarea
                  className={styles.textareaControl}
                  value={safeText(support.content)}
                  onChange={(event) => updateDoc12Field(0, 'content', event.target.value)}
                />
              </label>
            </div>
          </section>

          <section className={styles.sheetBlock}>
            <div className={styles.blockHeader}>
              <h3 className={styles.blockTitle}>기타 메모</h3>
            </div>
            <div className={styles.formStack}>
              <label className={styles.formStackRow}>
                <span className={styles.formLabel}>
                  기타 사항
                  {renderConfidenceBadge('sectionDrafts.doc14.body')}
                </span>
                <textarea
                  className={`${styles.textareaControl} ${styles.textareaTall}`}
                  value={safeText(workspace.sectionDrafts.doc14.body)}
                  onChange={(event) => updateDoc14Field('body', event.target.value)}
                />
              </label>

              {workspace.sectionDrafts.doc13.length > 0 ? (
                <div className={styles.noteList}>
                  {workspace.sectionDrafts.doc13.map((item, index) => (
                    <article key={`note-${index}`} className={styles.noteCard}>
                      <strong>{safeText(item.title)}</strong>
                      <p>{safeText(item.summary)}</p>
                    </article>
                  ))}
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </div>
    );
  }

  function renderCurrentSection() {
    switch (activeSectionId) {
      case 'section1':
        return renderSection1();
      case 'section2':
        return renderSection2();
      case 'section3':
        return renderSection3();
      case 'section4':
        return renderSection4();
      case 'section5':
        return renderSection5();
      case 'section6':
        return renderSection6();
      default:
        return renderSection1();
    }
  }

  return (
    <div className="erp-page">
      <section className="workspace-header-card">
        <div className="workspace-title-block">
          <Link href="/reports" className="back-link">
            이전
          </Link>
          <div>
            <span className="page-kicker">Report</span>
            <h1 className="page-title">{safeText(workspace.reportMeta.siteName)}</h1>
            <p className="page-meta-line">
              {safeText(workspace.reportMeta.visitDate)} · {safeText(workspace.reportMeta.drafterName)} ·{' '}
              {safeText(workspace.reportMeta.customerName)}
            </p>
          </div>
        </div>
        <div className={styles.headerAside}>
          {downloadState !== 'idle'
            ? downloadState === 'hwpx'
              ? 'HWPX 생성 중'
              : 'PDF 생성 중'
            : saveState === 'saving'
              ? '저장 중'
              : saveState === 'saved'
                ? '저장 완료'
                : saveState === 'error'
                  ? '저장 실패'
                  : '검토 화면'}
        </div>
      </section>

      <section className="workspace-toolbar-card">
        <div className={styles.toolbarLayout}>
          <div className={styles.toolbarGroup}>
            <span className="toolbar-label">문서 선택</span>
            <select
              className={`erp-select ${styles.toolbarSelect}`}
              value={activeSectionId}
              onChange={(event) => setActiveSectionId(event.target.value as ReportWorkspaceSectionId)}
            >
              {reportWorkspaceSections.map((section) => (
                <option key={section.id} value={section.id}>
                  {section.label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            className="erp-button erp-button-secondary"
            onClick={() => setActiveSectionId('section1')}
          >
            기본 정보
          </button>

          <div className={styles.toolbarGroupWide}>
            <span className="toolbar-label">진행률</span>
            <div className={styles.toolbarProgress}>
              <div className={styles.progressTrack}>
                <span className={styles.progressFill} style={{ width: `${progressValue}%` }} />
              </div>
              <div className={styles.progressSummary}>
                <strong className={styles.progressValue}>{progressValue}%</strong>
                <span className={styles.progressMeta}>{progressMeta}</span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.toolbarActions}>
          <button
            type="button"
            className="erp-button erp-button-secondary"
            onClick={() => moveSection(-1)}
            disabled={activeSectionIndex === 0}
          >
            이전
          </button>
          {activeSectionId !== 'section6' ? (
            <button
              type="button"
              className="erp-button erp-button-primary"
              onClick={() => moveSection(1)}
              disabled={activeSectionIndex === reportWorkspaceSections.length - 1}
            >
              다음
            </button>
          ) : null}
          <button
            type="button"
            className="erp-button erp-button-secondary"
            onClick={() => {
              void handleDownload('hwpx');
            }}
            disabled={downloadState !== 'idle'}
          >
            HWPX 다운로드
          </button>
          <button
            type="button"
            className="erp-button erp-button-secondary"
            onClick={() => {
              void handleDownload('pdf');
            }}
            disabled={downloadState !== 'idle'}
          >
            PDF 다운로드
          </button>
        </div>
      </section>

      {renderAiStatusPanel()}

      <section className={`erp-panel ${styles.reviewPanel}`}>
        <div className={styles.reviewPanelHeader}>
          <div>
            <span className={styles.editorEyebrow}>Review Queue</span>
            <h2 className={styles.reviewPanelTitle}>검토 필요 항목</h2>
            <p className={styles.reviewPanelSummary}>{reviewSummaryMessage}</p>
          </div>
          <div className={styles.reviewSummaryBadges}>
            <span className={`${styles.reviewSummaryBadge} ${styles.reviewSummaryRequired}`}>
              필수 {unresolvedRequiredReviewQueue.length}
            </span>
            <span className={`${styles.reviewSummaryBadge} ${styles.reviewSummaryWarning}`}>
              경고 {unresolvedWarningReviewQueue.length}
            </span>
            <span className={`${styles.reviewSummaryBadge} ${styles.reviewSummaryInfo}`}>
              참고 {unresolvedInfoReviewQueue.length}
            </span>
          </div>
        </div>

        <div className={`${styles.reviewSummaryStrip} ${reviewSummaryTone}`}>
          <div className={styles.reviewSummaryCopy}>
            <strong>
              {unresolvedReviewQueue.length > 0
                ? `${unresolvedReviewQueue.length}개 항목이 남아 있습니다.`
                : '모든 검토 항목이 정리되었습니다.'}
            </strong>
            <span>{reviewSummaryMessage}</span>
          </div>
          <button
            type="button"
            className="erp-button erp-button-secondary"
            onClick={() => setReviewQueueOpen(true)}
          >
            검토 필요 항목 보기
          </button>
        </div>
      </section>

      {reviewQueueOpen ? (
        <div
          className={styles.disclaimerBackdrop}
          role="presentation"
          onClick={() => setReviewQueueOpen(false)}
        >
          <section
            className={`${styles.disclaimerDialog} ${styles.reviewQueueDialog}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="review-queue-dialog-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.disclaimerHeader}>
              <div>
                <span className={styles.editorEyebrow}>Review Queue</span>
                <h2 id="review-queue-dialog-title" className={styles.reviewPanelTitle}>
                  검토 필요 항목
                </h2>
                <p className={styles.reviewPanelSummary}>{reviewSummaryMessage}</p>
              </div>
              <button
                type="button"
                className="erp-button erp-button-secondary"
                onClick={() => setReviewQueueOpen(false)}
              >
                닫기
              </button>
            </div>

            {unresolvedReviewQueue.length === 0 ? (
              <div className={styles.reviewEmptyState}>현재 확인이 필요한 항목이 없습니다.</div>
            ) : (
              <div className={`${styles.reviewList} ${styles.reviewDialogList}`}>
                {unresolvedReviewQueue.map((item) => (
                  <article key={item.id || item.fieldPath} className={styles.reviewCard}>
                    <div className={styles.reviewCardHeader}>
                      <div>
                        <strong>{item.label}</strong>
                        <p>{safeText(item.reason) || safeText(item.notes) || '사용자 확인이 필요합니다.'}</p>
                      </div>
                      <span
                        className={`${styles.reviewSeverityChip} ${
                          item.severity === 'required'
                            ? styles.reviewSeverityRequired
                            : item.severity === 'warning'
                              ? styles.reviewSeverityWarning
                              : styles.reviewSeverityInfo
                        }`}
                      >
                        {item.severity === 'required'
                          ? '필수'
                          : item.severity === 'warning'
                            ? '경고'
                            : '참고'}
                      </span>
                    </div>

                    <div className={styles.reviewMetaGrid}>
                      <div>
                        <span>현재값</span>
                        <strong>{safeText(item.currentValue) || '-'}</strong>
                      </div>
                      <div>
                        <span>추천값</span>
                        <strong>{safeText(item.suggestedValue) || '-'}</strong>
                      </div>
                      <div>
                        <span>근거 사진</span>
                        <strong>
                          {item.evidencePhotoIds.length > 0 ? item.evidencePhotoIds.join(', ') : '-'}
                        </strong>
                      </div>
                    </div>

                    <div className={styles.reviewActions}>
                      <button
                        type="button"
                        className="erp-button erp-button-secondary"
                        onClick={() => {
                          setReviewQueueOpen(false);
                          jumpToReviewItem(item);
                        }}
                      >
                        해당 섹션으로 이동
                      </button>
                      <button
                        type="button"
                        className="erp-button erp-button-secondary"
                        onClick={() => toggleReviewItemResolved(item.fieldPath)}
                      >
                        확인 완료
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      ) : null}

      {selectedObservation ? (
        <div
          className={styles.disclaimerBackdrop}
          role="presentation"
          onClick={() => setObservationDrawerIndex(null)}
        >
          <section
            className={`${styles.disclaimerDialog} ${styles.observationDrawer}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="observation-drawer-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.disclaimerHeader}>
              <div>
                <span className={styles.editorEyebrow}>Photo Observation</span>
                <h2 id="observation-drawer-title" className={styles.reviewPanelTitle}>
                  {observationDisplayTitle(selectedObservation)}
                </h2>
                <p className={styles.reviewPanelSummary}>
                  {selectedObservation.photoRole === 'step2_hazard'
                    ? '위험요인 사진 기반 관찰카드'
                    : '전경/공정 사진 기반 관찰카드'}
                </p>
              </div>
              <button
                type="button"
                className="erp-button erp-button-secondary"
                onClick={() => setObservationDrawerIndex(null)}
              >
                닫기
              </button>
            </div>

            <div className={styles.observationDrawerGrid}>
              <div>
                <span>작업 맥락</span>
                <strong>
                  {safeText(selectedObservation.workContext?.summary) ||
                    safeText(selectedObservation.observedProcess) ||
                    '확인 필요'}
                </strong>
              </div>
              <div>
                <span>위험 맥락</span>
                <strong>
                  {safeText(selectedObservation.riskContext?.hazardSummary) ||
                    safeText(selectedObservation.observedRiskStructured?.hazardSummary) ||
                    '확인 필요'}
                </strong>
              </div>
              <div>
                <span>기인물 / 재해유형</span>
                <strong>
                  {safeText(selectedObservation.riskContext?.causativeAgent) ||
                    safeText(selectedObservation.observedRiskStructured?.causativeAgent) ||
                    '확인 필요'}{' '}
                  ·{' '}
                  {safeText(selectedObservation.riskContext?.accidentType) ||
                    safeText(selectedObservation.observedRiskStructured?.accidentType) ||
                    '확인 필요'}
                </strong>
              </div>
              <div>
                <span>표준 매칭</span>
                <strong>{safeText(selectedObservation.standardMapping?.ruleKey) || '확인 필요'}</strong>
              </div>
            </div>

            <div className={styles.observationDetailSection}>
              <strong>시각 객체</strong>
              <div className={styles.aiChipList}>
                {selectedObservation.visualObjects.length > 0 ? (
                  selectedObservation.visualObjects.map((item, index) => (
                    <span key={`${item.label}-${index}`} className={styles.aiEvidenceChip}>
                      {safeText(item.label) || 'object'} · {formatConfidence(item.confidence)}
                    </span>
                  ))
                ) : (
                  <span className={styles.aiEvidenceChip}>fallback keyword</span>
                )}
              </div>
            </div>

            <div className={styles.observationDetailSection}>
              <strong>검토 사유</strong>
              {selectedObservation.reviewReasons.length > 0 ? (
                <ul className={styles.observationReasonList}>
                  {selectedObservation.reviewReasons.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
              ) : (
                <p>추가 확인 사유가 없습니다.</p>
              )}
            </div>
          </section>
        </div>
      ) : null}

      {disclaimerOpen ? (
        <div className={styles.disclaimerBackdrop} role="dialog" aria-modal="true" aria-labelledby="export-disclaimer-title">
          <div className={styles.disclaimerDialog}>
            <div className={styles.disclaimerHeader}>
              <div>
                <span className={styles.editorEyebrow}>다운로드 전 확인</span>
                <h2 id="export-disclaimer-title" className={styles.disclaimerTitle}>
                  최초 1회 책임 확인이 필요합니다
                </h2>
              </div>
              <button
                type="button"
                className="erp-button erp-button-secondary"
                onClick={() => {
                  setDisclaimerOpen(false);
                  setPendingDownloadFormat(null);
                  setPendingDownloadContext(null);
                  setDisclaimerError('');
                }}
              >
                닫기
              </button>
            </div>

            <div className={styles.disclaimerBody}>
              <div className={styles.disclaimerPanel}>
                <strong>확인 내용</strong>
                <ul className={styles.disclaimerList}>
                  <li>이 보고서는 AI가 초안을 보조한 문서이며, 법적 효력을 자동으로 보장하지 않습니다.</li>
                  <li>최종 검토, 보완, 제출 판단과 기술지도 보고서의 책임은 전적으로 사용자에게 있습니다.</li>
                  <li>당사는 AI 초안 생성 도구를 제공하며, 개별 현장의 법적 책임이나 행정 책임을 대리하지 않습니다.</li>
                </ul>
              </div>

              <label className={styles.disclaimerField}>
                <span>성함 또는 서명명</span>
                <input
                  className={styles.inputControl}
                  value={typedSignatureName}
                  onChange={(event) => setTypedSignatureName(event.target.value)}
                  placeholder="홍길동"
                />
              </label>

              {disclaimerError ? <div className={styles.inlineNotice}>{disclaimerError}</div> : null}
            </div>

            <div className={styles.disclaimerFooter}>
              <p className={styles.disclaimerFootnote}>
                최초 1회 확인 후 같은 워크스페이스에서는 다시 묻지 않습니다.
              </p>
              <button type="button" className="erp-button erp-button-primary" onClick={() => void handleDisclaimerConfirm()}>
                확인 후 다운로드 계속
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {authDialogOpen ? (
        <div className={styles.disclaimerBackdrop} role="dialog" aria-modal="true" aria-labelledby="export-account-title">
          <div className={styles.disclaimerDialog}>
            <div className={styles.disclaimerHeader}>
              <div>
                <span className={styles.editorEyebrow}>다운로드 전 로그인</span>
                <h2 id="export-account-title" className={styles.disclaimerTitle}>
                  계정 연결 후 다운로드를 이어갑니다
                </h2>
              </div>
              <button
                type="button"
                className="erp-button erp-button-secondary"
                onClick={() => {
                  setAuthDialogOpen(false);
                  setPendingDownloadFormat(null);
                  setPendingDownloadContext(null);
                  setAnonymousTokenForClaim(null);
                }}
                disabled={authBusy}
              >
                닫기
              </button>
            </div>

            <div className={styles.disclaimerBody}>
              <div className={styles.disclaimerPanel}>
                <strong>안내</strong>
                <p className={styles.authHelper}>
                  PDF/HWPX 다운로드 전에는 구글 계정 확인이 필요합니다.
                </p>
              </div>
            </div>

            <div className={styles.disclaimerFooter}>
              <p className={styles.disclaimerFootnote}>
                {localRecordMode
                  ? '로컬 임시 보고서는 로그인 후 서버에 동기화한 뒤 다운로드를 진행합니다.'
                  : '비로그인 작업 내용은 로그인 후 현재 계정 작업공간으로 이어집니다.'}
              </p>
              <button
                type="button"
                className="erp-button erp-button-primary"
                onClick={() => void handleAccountConfirm()}
                disabled={authBusy}
              >
                {authBusy ? '이동 중...' : 'Google로 계속'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <section className={`erp-panel ${styles.editorPanel}`}>
        <div className={styles.editorHeader}>
          <div>
            <span className={styles.editorEyebrow}>Section</span>
            <h2 className={styles.editorTitle}>{activeSection.label}</h2>
          </div>
          <span className={styles.editorBadge}>{activeSection.compactLabel}</span>
        </div>

        {actionError ? <div className={styles.inlineNotice}>{actionError}</div> : null}

        <div className={styles.editorBody}>{renderCurrentSection()}</div>
      </section>
    </div>
  );
}

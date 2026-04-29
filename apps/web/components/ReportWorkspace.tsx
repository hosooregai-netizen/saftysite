'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { reportPayloadSchema, type ReportPayload } from '@saftysite/contracts';
import {
  bootstrapDemoSession,
  markReportReviewComplete,
  patchReportRecord,
  registerReportExport,
} from '@/lib/reportApi';
import {
  reportWorkspaceSections,
  resolveReportWorkspaceSectionId,
  type ReportWorkspaceSectionId,
} from '@/lib/demoData';
import { mapReportPayloadToInspectionSession } from '@/lib/reportSessionMapper';
import { fetchInspectionHwpxDocument, fetchInspectionPdfDocument, saveBlobAsFile } from '../../../lib/api';
import styles from './ReportWorkspace.module.css';

type WorkspaceDraft = {
  reportMeta: ReportPayload['reportMeta'];
  sectionDrafts: ReportPayload['sectionDrafts'];
  findingCandidates: ReportPayload['findingCandidates'];
  photoEvidence: ReportPayload['photoEvidence'];
};

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

  return reportPayloadSchema.parse({
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
      valid: true,
      blockingIssues: [],
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
}

type ReportWorkspaceProps = {
  reportId: string;
  report: ReportPayload;
};

export default function ReportWorkspace({ reportId, report }: ReportWorkspaceProps) {
  const normalizedReport = normalizeReport(report);
  const [baseReport, setBaseReport] = useState<ReportPayload>(normalizedReport);
  const [workspace, setWorkspace] = useState<WorkspaceDraft>(() => buildWorkspaceDraft(normalizedReport));
  const [activeSectionId, setActiveSectionId] = useState<ReportWorkspaceSectionId>(() =>
    resolveReportWorkspaceSectionId(normalizedReport.currentSection),
  );
  const [followUpRows, setFollowUpRows] = useState<FollowUpRow[]>(() => buildFollowUpRows(normalizedReport));
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [actionError, setActionError] = useState('');
  const [downloadState, setDownloadState] = useState<DownloadState>('idle');

  const baseReportRef = useRef(baseReport);
  const workspaceRef = useRef(workspace);
  const followUpRowsRef = useRef(followUpRows);
  const activeSectionIdRef = useRef(activeSectionId);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savePromiseRef = useRef<Promise<void> | null>(null);
  const lastSavedSignatureRef = useRef('');
  const didMountRef = useRef(false);

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
    const nextReport = normalizeReport(report);
    const nextWorkspace = buildWorkspaceDraft(nextReport);
    const nextFollowUps = buildFollowUpRows(nextReport);
    const nextSectionId = resolveReportWorkspaceSectionId(nextReport.currentSection);
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
    lastSavedSignatureRef.current = JSON.stringify(nextPersisted);
    didMountRef.current = false;
  }, [report, reportId]);

  const activeSectionIndex = Math.max(
    0,
    reportWorkspaceSections.findIndex((section) => section.id === activeSectionId),
  );
  const activeSection = reportWorkspaceSections[activeSectionIndex] ?? reportWorkspaceSections[0];
  const section4Photos = workspace.photoEvidence.filter((photo) => photo.sourceStep === 'step2_hazard');
  const photoCount = workspace.photoEvidence.length;
  const reviewPendingCount = baseReport.reviewMeta.reviewQueue.filter((item) => item.needsReview).length;
  const entryModeLabel = baseReport.workspaceEntryMode === 'direct_reopen' ? '기본 폼 진입' : '사진 반영';
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
        const session = await bootstrapDemoSession();
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
  }, [reportId]);

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

  async function handleDownload(format: 'hwpx' | 'pdf') {
    setActionError('');
    setDownloadState(format);

    try {
      const payload = await flushAutosave();
      const session = mapReportPayloadToInspectionSession(reportId, payload);
      const file =
        format === 'hwpx'
          ? await fetchInspectionHwpxDocument(session)
          : await fetchInspectionPdfDocument(session);

      saveBlobAsFile(file.blob, file.filename);

      const reportSession = await bootstrapDemoSession();
      await markReportReviewComplete(reportSession, reportId);
      const updated = await registerReportExport(reportSession, reportId, format);
      const nextReport = normalizeReport(updated.payload);
      setBaseReport(nextReport);
      baseReportRef.current = nextReport;
      lastSavedSignatureRef.current = JSON.stringify(
        buildPersistedReport(nextReport, workspaceRef.current, followUpRowsRef.current, activeSectionIdRef.current),
      );
      setSaveState('saved');
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
                    <span className={styles.formLabel}>유해·위험요인</span>
                    <textarea
                      className={styles.textareaControl}
                      value={safeText(finding.hazardDescription)}
                      onChange={(event) => updateFindingField(index, 'hazardDescription', event.target.value)}
                    />
                  </label>
                  <label className={`${styles.formStackRow} ${styles.fieldSpan}`}>
                    <span className={styles.formLabel}>지적사항 / 개선요청</span>
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
          </div>
          {workspace.sectionDrafts.doc8.map((plan, index) => (
            <div key={`plan-${index}`} className={styles.planRow}>
              <input
                className={styles.inputControl}
                value={safeText(plan.processName)}
                onChange={(event) => updatePlanField(index, 'processName', event.target.value)}
              />
              <textarea
                className={`${styles.textareaControl} ${styles.textareaTall}`}
                value={safeText(plan.hazard)}
                onChange={(event) => updatePlanField(index, 'hazard', event.target.value)}
              />
              <textarea
                className={`${styles.textareaControl} ${styles.textareaTall}`}
                value={safeText(plan.countermeasure)}
                onChange={(event) => updatePlanField(index, 'countermeasure', event.target.value)}
              />
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
                <span className={styles.formLabel}>교육내용</span>
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
                <span className={styles.formLabel}>지원사항</span>
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
                <span className={styles.formLabel}>기타 사항</span>
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
          <button
            type="button"
            className="erp-button erp-button-primary"
            onClick={() => moveSection(1)}
            disabled={activeSectionIndex === reportWorkspaceSections.length - 1}
          >
            다음
          </button>
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

      <section className={`erp-panel ${styles.editorPanel}`}>
        <div className={styles.editorHeader}>
          <div>
            <span className={styles.editorEyebrow}>Section</span>
            <h2 className={styles.editorTitle}>{activeSection.label}</h2>
          </div>
          <span className={styles.editorBadge}>{activeSection.compactLabel}</span>
        </div>

        {actionError ? <div className={styles.inlineNotice}>{actionError}</div> : null}

        <div className={styles.sectionSummaryStrip}>
          <article className={styles.sectionSummaryCard}>
            <span>진입 방식</span>
            <strong>{entryModeLabel}</strong>
          </article>
          <article className={styles.sectionSummaryCard}>
            <span>첨부 사진</span>
            <strong>{photoCount === 0 ? '없음' : `${photoCount}건`}</strong>
          </article>
          <article className={styles.sectionSummaryCard}>
            <span>검토 대기</span>
            <strong>{reviewPendingCount}건</strong>
          </article>
        </div>

        <div className={styles.editorBody}>{renderCurrentSection()}</div>
      </section>
    </div>
  );
}

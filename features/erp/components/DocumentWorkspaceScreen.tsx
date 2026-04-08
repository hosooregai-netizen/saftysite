'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import LoginPanel from '@/components/auth/LoginPanel';
import AppModal from '@/components/ui/AppModal';
import {
  SafetyApiError,
  createSiteWorkerMobileSession,
  fetchSafetyContentItems,
  fetchSafetyReportById,
  fetchSafetyReportDraftContext,
  fetchSafetySiteDashboard,
  fetchSiteWorkers,
  updateSafetyReportStatus,
  upsertSafetyReport,
} from '@/lib/safetyApi';
import { uploadSafetyAssetFile, validateSafetyAssetFile } from '@/lib/safetyApi/assets';
import type {
  ErpDocumentKind,
  HazardNoticePayload,
  MobileAcknowledgementRecord,
  SafetyContentItem,
  SafetyEducationPayload,
  SafetyInspectionChecklistItem,
  SafetyInspectionPayload,
  SafetyReport,
  SafetyReportDraftContext,
  SafetySiteDashboard,
  SafetySignatureRecord,
  SiteWorker,
  SafetyWorkLogPayload,
  TbmDocumentPayload,
  WorkerMobileSession,
} from '@/types/backend';
import { useErpProtectedScreen } from '@/features/erp/hooks/useErpProtectedScreen';
import {
  ERP_DOCUMENT_KIND_LABELS,
  ERP_REPORT_STATUS_LABELS,
  buildSiteDashboardHref,
  buildSiteSafetyHref,
  buildSiteWorkersHref,
  createDefaultErpPayload,
  formatErpDateTime,
  fromLineItems,
  getDocumentKindMeta,
  getTemplateTypesForDocuments,
  isWorkerAckTarget,
  toLineItems,
  type WorkerAckDrilldownKind,
} from '@/features/erp/lib/shared';
import { ErpSiteShell } from './ErpSiteShell';
import styles from './ErpScreen.module.css';

interface AiDraftSuggestion {
  bullet_items: string[];
  cautions: string[];
  summary: string;
  title: string;
}

interface DocumentValidationIssue {
  id: string;
  message: string;
}

interface ReissuedPendingWorkerLink {
  session: WorkerMobileSession;
  worker: SiteWorker;
}

type SaveActivity = 'autosave' | 'manual_save' | 'status' | 'upload' | null;
type SaveDocumentOptions = {
  background?: boolean;
};
type WorkerAckField =
  | 'latest_hazard_notice_ack_at'
  | 'latest_tbm_ack_at'
  | 'latest_education_ack_at';

const CHECKLIST_STATUS_PRIORITY: Record<SafetyInspectionChecklistItem['status'], number> = {
  good: 0,
  warning: 1,
  action_required: 2,
};
const WORKER_ACK_FIELD_BY_KIND: Partial<Record<ErpDocumentKind, WorkerAckField>> = {
  hazard_notice: 'latest_hazard_notice_ack_at',
  tbm: 'latest_tbm_ack_at',
  safety_education: 'latest_education_ack_at',
};
const ERP_AUTOSAVE_DEBOUNCE_MS = 8000;

function getErrorMessage(error: unknown): string {
  if (error instanceof SafetyApiError || error instanceof Error) {
    return error.message;
  }

  return '문서 편집 화면을 처리하는 중 오류가 발생했습니다.';
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function asOptionalString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
}

function escapeCsvCell(value: string): string {
  const normalized = value.replaceAll('"', '""');
  return /[",\n]/.test(normalized) ? `"${normalized}"` : normalized;
}

function downloadCsvFile(filename: string, rows: string[][]) {
  const csv = rows.map((row) => row.map((cell) => escapeCsvCell(cell)).join(',')).join('\n');
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function buildAbsoluteEntryUrl(entryUrl: string): string {
  if (typeof window === 'undefined') {
    return entryUrl;
  }
  return new URL(entryUrl, window.location.origin).toString();
}

function mergeUniqueStrings(existing: string[], incoming: string[]): string[] {
  const merged: string[] = [];
  const seen = new Set<string>();

  for (const item of [...existing, ...incoming]) {
    const normalized = item.trim();
    if (!normalized) continue;
    const key = normalized.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(normalized);
  }

  return merged;
}

function mergeSignatures(
  existing: SafetySignatureRecord[],
  incoming: SafetySignatureRecord[]
): SafetySignatureRecord[] {
  if (existing.length > 0) return existing;
  return incoming.filter((item) => item.name.trim());
}

function mergeChecklistItems(
  existing: SafetyInspectionChecklistItem[],
  incoming: SafetyInspectionChecklistItem[]
): SafetyInspectionChecklistItem[] {
  const merged = new Map<string, SafetyInspectionChecklistItem>();

  for (const item of [...existing, ...incoming]) {
    const label = item.item.trim();
    if (!label) continue;
    const key = label.toLowerCase();
    const current = merged.get(key);
    if (!current) {
      merged.set(key, { ...item, item: label });
      continue;
    }

    const nextStatus =
      CHECKLIST_STATUS_PRIORITY[item.status] > CHECKLIST_STATUS_PRIORITY[current.status]
        ? item.status
        : current.status;
    merged.set(key, {
      ...current,
      item: current.item || label,
      status: nextStatus,
      note: current.note || item.note,
    });
  }

  return Array.from(merged.values());
}

function getPhotoFileName(photoUrl: string, index: number): string {
  const normalized = photoUrl.split('?')[0] ?? photoUrl;
  const segments = normalized.split('/');
  const lastSegment = segments[segments.length - 1] || `photo-${index + 1}`;
  return lastSegment.includes('-') ? lastSegment.split('-').slice(1).join('-') || lastSegment : lastSegment;
}

function normalizeSignatures(value: unknown): SafetySignatureRecord[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      const record = asRecord(item);
      return {
        name: asString(record.name),
        company_name: asOptionalString(record.company_name),
        signed_at: asOptionalString(record.signed_at),
        signature_data: asOptionalString(record.signature_data),
      };
    })
    .filter((item) => item.name);
}

function normalizeChecklist(value: unknown): SafetyInspectionChecklistItem[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      const record = asRecord(item);
      const statusValue = asString(record.status);
      return {
        item: asString(record.item),
        status:
          statusValue === 'good' ||
          statusValue === 'warning' ||
          statusValue === 'action_required'
            ? statusValue
            : 'warning',
        note: asString(record.note),
      } satisfies SafetyInspectionChecklistItem;
    })
    .filter((item) => item.item);
}

function normalizeMobileAcknowledgements(value: unknown): MobileAcknowledgementRecord[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      const record = asRecord(item);
      const kind = asOptionalString(record.kind);
      return {
        worker_id: asOptionalString(record.worker_id),
        worker_name: asOptionalString(record.worker_name),
        kind:
          kind === 'tbm' ||
          kind === 'hazard_notice' ||
          kind === 'safety_education' ||
          kind === 'safety_work_log' ||
          kind === 'safety_inspection_log' ||
          kind === 'patrol_inspection_log'
            ? kind
            : null,
        signature_name: asOptionalString(record.signature_name),
        signature_data: asOptionalString(record.signature_data),
        note: asOptionalString(record.note),
        acknowledged_at: asOptionalString(record.acknowledged_at),
      } satisfies MobileAcknowledgementRecord;
    })
    .filter((item) => item.worker_name || item.signature_name || item.acknowledged_at);
}

function buildReportPayloadForSave(payload: Record<string, unknown>): Record<string, unknown> {
  const nextPayload = { ...payload };

  // Mobile acknowledgements are appended by the worker flow and can grow large
  // enough to trip the proxy body limit, so preserve them on the server instead
  // of resending them on every ERP save.
  delete nextPayload.mobileAcknowledgements;

  return nextPayload;
}

function normalizePayloadForKind(
  kind: 'tbm',
  payload: object
): TbmDocumentPayload;
function normalizePayloadForKind(
  kind: 'tbm' | 'safety_education',
  payload: object
): TbmDocumentPayload | SafetyEducationPayload;
function normalizePayloadForKind(
  kind: 'hazard_notice',
  payload: object
): HazardNoticePayload;
function normalizePayloadForKind(
  kind: 'safety_education',
  payload: object
): SafetyEducationPayload;
function normalizePayloadForKind(
  kind: 'safety_work_log',
  payload: object
): SafetyWorkLogPayload;
function normalizePayloadForKind(
  kind: 'safety_inspection_log' | 'patrol_inspection_log',
  payload: object
): SafetyInspectionPayload;
function normalizePayloadForKind(
  kind: ErpDocumentKind,
  payload: object
):
  | TbmDocumentPayload
  | HazardNoticePayload
  | SafetyEducationPayload
  | SafetyWorkLogPayload
  | SafetyInspectionPayload;
function normalizePayloadForKind(kind: ErpDocumentKind, payload: object) {
  const defaults = createDefaultErpPayload(kind);
  const merged = {
    ...(defaults as unknown as Record<string, unknown>),
    ...(payload as Record<string, unknown>),
  } as Record<string, unknown>;

  if (kind === 'tbm') {
    return {
      ...merged,
      topic: asString(merged.topic),
      riskFactors: asStringArray(merged.riskFactors),
      countermeasures: asStringArray(merged.countermeasures),
      signatures: normalizeSignatures(merged.signatures),
    } satisfies TbmDocumentPayload;
  }

  if (kind === 'hazard_notice') {
    return {
      ...merged,
      title: asString(merged.title),
      content: asString(merged.content),
      targetTrades: asStringArray(merged.targetTrades),
      effectiveFrom: asOptionalString(merged.effectiveFrom),
      effectiveTo: asOptionalString(merged.effectiveTo),
      noticeItems: asStringArray(merged.noticeItems),
    } satisfies HazardNoticePayload;
  }

  if (kind === 'safety_education') {
    return {
      ...merged,
      educationName: asString(merged.educationName),
      materialSummary: asString(merged.materialSummary),
      agenda: asStringArray(merged.agenda),
      signatures: normalizeSignatures(merged.signatures),
    };
  }

  if (kind === 'safety_work_log') {
    return {
      ...merged,
      workerCount:
        typeof merged.workerCount === 'number' && Number.isFinite(merged.workerCount)
          ? merged.workerCount
          : null,
      mainTasks: asStringArray(merged.mainTasks),
      issues: asStringArray(merged.issues),
      photos: asStringArray(merged.photos),
    } satisfies SafetyWorkLogPayload;
  }

  return {
    ...merged,
    checklist: normalizeChecklist(merged.checklist),
    actions: asStringArray(merged.actions),
    photos: asStringArray(merged.photos),
  } satisfies SafetyInspectionPayload;
}

function validateErpDocument(
  kind: ErpDocumentKind,
  title: string,
  payload:
    | TbmDocumentPayload
    | HazardNoticePayload
    | SafetyEducationPayload
    | SafetyWorkLogPayload
    | SafetyInspectionPayload
): DocumentValidationIssue[] {
  const issues: DocumentValidationIssue[] = [];
  if (!title.trim()) {
    issues.push({ id: 'title', message: '문서 제목을 입력해 주세요.' });
  }

  if (kind === 'tbm') {
    const typedPayload = payload as TbmDocumentPayload;
    if (!typedPayload.topic.trim()) {
      issues.push({ id: 'tbm-topic', message: 'TBM 작업 주제를 입력해 주세요.' });
    }
    if (typedPayload.riskFactors.length === 0) {
      issues.push({ id: 'tbm-risks', message: 'TBM 위험요인을 1개 이상 입력해 주세요.' });
    }
    if (typedPayload.countermeasures.length === 0) {
      issues.push({ id: 'tbm-countermeasures', message: 'TBM 대책을 1개 이상 입력해 주세요.' });
    }
    return issues;
  }

  if (kind === 'hazard_notice') {
    const typedPayload = payload as HazardNoticePayload;
    if (!typedPayload.title.trim()) {
      issues.push({ id: 'notice-title', message: '공지 제목을 입력해 주세요.' });
    }
    if (!typedPayload.content.trim()) {
      issues.push({ id: 'notice-content', message: '공지 내용을 입력해 주세요.' });
    }
    if (typedPayload.noticeItems.length === 0) {
      issues.push({ id: 'notice-items', message: '핵심 안내 항목을 1개 이상 입력해 주세요.' });
    }
    return issues;
  }

  if (kind === 'safety_education') {
    const typedPayload = payload as SafetyEducationPayload;
    if (!typedPayload.educationName.trim()) {
      issues.push({ id: 'education-name', message: '교육명을 입력해 주세요.' });
    }
    if (!typedPayload.materialSummary.trim()) {
      issues.push({ id: 'education-summary', message: '교육 요약을 입력해 주세요.' });
    }
    if (typedPayload.agenda.length === 0) {
      issues.push({ id: 'education-agenda', message: '교육 아젠다를 1개 이상 입력해 주세요.' });
    }
    return issues;
  }

  if (kind === 'safety_work_log') {
    const typedPayload = payload as SafetyWorkLogPayload;
    if (typedPayload.workerCount === null || typedPayload.workerCount <= 0) {
      issues.push({ id: 'work-log-workers', message: '작업 인원을 입력해 주세요.' });
    }
    if (typedPayload.mainTasks.length === 0) {
      issues.push({ id: 'work-log-tasks', message: '주요 작업을 1개 이상 입력해 주세요.' });
    }
    return issues;
  }

  const typedPayload = payload as SafetyInspectionPayload;
  if (typedPayload.checklist.length === 0) {
    issues.push({ id: 'inspection-checklist', message: '점검 항목을 1개 이상 입력해 주세요.' });
  }
  if (typedPayload.actions.length === 0) {
    issues.push({ id: 'inspection-actions', message: '조치 내역을 1개 이상 입력해 주세요.' });
  }
  return issues;
}

function mergeDraftPayload(
  kind: ErpDocumentKind,
  currentPayload: object,
  incomingPayload: object
): Record<string, unknown> {
  if (kind === 'tbm') {
    const current = normalizePayloadForKind(kind, currentPayload);
    const incoming = normalizePayloadForKind(kind, incomingPayload);
    return {
      ...current,
      topic: current.topic || incoming.topic,
      riskFactors: mergeUniqueStrings(current.riskFactors, incoming.riskFactors),
      countermeasures: mergeUniqueStrings(current.countermeasures, incoming.countermeasures),
      signatures: mergeSignatures(current.signatures, incoming.signatures),
    };
  }

  if (kind === 'hazard_notice') {
    const current = normalizePayloadForKind(kind, currentPayload);
    const incoming = normalizePayloadForKind(kind, incomingPayload);
    return {
      ...current,
      title: current.title || incoming.title,
      content: current.content || incoming.content,
      targetTrades: mergeUniqueStrings(current.targetTrades, incoming.targetTrades),
      effectiveFrom: current.effectiveFrom || incoming.effectiveFrom,
      effectiveTo: current.effectiveTo || incoming.effectiveTo,
      noticeItems: mergeUniqueStrings(current.noticeItems, incoming.noticeItems),
    };
  }

  if (kind === 'safety_education') {
    const current = normalizePayloadForKind(kind, currentPayload);
    const incoming = normalizePayloadForKind(kind, incomingPayload);
    return {
      ...current,
      educationName: current.educationName || incoming.educationName,
      materialSummary: current.materialSummary || incoming.materialSummary,
      agenda: mergeUniqueStrings(current.agenda, incoming.agenda),
      signatures: mergeSignatures(current.signatures, incoming.signatures),
    };
  }

  if (kind === 'safety_work_log') {
    const current = normalizePayloadForKind(kind, currentPayload);
    const incoming = normalizePayloadForKind(kind, incomingPayload);
    return {
      ...current,
      workerCount: current.workerCount ?? incoming.workerCount,
      mainTasks: mergeUniqueStrings(current.mainTasks, incoming.mainTasks),
      issues: mergeUniqueStrings(current.issues, incoming.issues),
      photos: mergeUniqueStrings(current.photos, incoming.photos),
    };
  }

  const current = normalizePayloadForKind(kind, currentPayload);
  const incoming = normalizePayloadForKind(kind, incomingPayload);
  return {
    ...current,
    checklist: mergeChecklistItems(current.checklist, incoming.checklist),
    actions: mergeUniqueStrings(current.actions, incoming.actions),
    photos: mergeUniqueStrings(current.photos, incoming.photos),
  };
}

function getTemplatePreview(items: SafetyContentItem[], kind: ErpDocumentKind): string[] {
  const meta = getDocumentKindMeta(kind);
  return items
    .filter((item) => item.content_type === meta.templateContentType)
    .flatMap((item) => {
      const body = item.body;
      if (typeof body === 'string') {
        return body
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean)
          .slice(0, 5);
      }

      if (Array.isArray(body)) {
        return body
          .filter((entry): entry is string => typeof entry === 'string')
          .slice(0, 5);
      }

      const record = asRecord(body);
      return Object.values(record)
        .flatMap((value) =>
          typeof value === 'string' ? value.split('\n').map((line) => line.trim()) : []
        )
        .filter(Boolean)
        .slice(0, 5);
    });
}

interface DocumentWorkspaceScreenProps {
  documentId: string;
}

export function DocumentWorkspaceScreen({ documentId }: DocumentWorkspaceScreenProps) {
  const { authError, currentUser, isAuthenticated, isReady, login, logout, shouldShowLogin, token } =
    useErpProtectedScreen();
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const isMountedRef = useRef(true);
  const tokenRef = useRef<string | null>(token ?? null);
  const reportRef = useRef<SafetyReport | null>(null);
  const isDirtyRef = useRef(false);
  const isSavingRef = useRef(false);
  const pendingAutosaveRef = useRef(false);
  const draftVersionRef = useRef(0);
  const saveDocumentRef = useRef<
    ((reason?: 'autosave' | 'manual_save', options?: SaveDocumentOptions) => Promise<SafetyReport | null>) | null
  >(null);
  const [report, setReport] = useState<SafetyReport | null>(null);
  const [dashboard, setDashboard] = useState<SafetySiteDashboard | null>(null);
  const [contentItems, setContentItems] = useState<SafetyContentItem[]>([]);
  const [siteWorkers, setSiteWorkers] = useState<SiteWorker[]>([]);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftVisitDate, setDraftVisitDate] = useState('');
  const [draftPayload, setDraftPayload] = useState<Record<string, unknown>>({});
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<AiDraftSuggestion | null>(null);
  const [draftContext, setDraftContext] = useState<SafetyReportDraftContext | null>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);
  const [isReissuingPendingLinks, setIsReissuingPendingLinks] = useState(false);
  const [saveActivity, setSaveActivity] = useState<SaveActivity>(null);
  const [lastAutosavedAt, setLastAutosavedAt] = useState<string | null>(null);
  const [lastManualSavedAt, setLastManualSavedAt] = useState<string | null>(null);
  const [isFinalizeWarningOpen, setIsFinalizeWarningOpen] = useState(false);
  const [reissuedPendingLinks, setReissuedPendingLinks] = useState<ReissuedPendingWorkerLink[]>([]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    tokenRef.current = token ?? null;
  }, [token]);

  useEffect(() => {
    reportRef.current = report;
  }, [report]);

  useEffect(() => {
    isDirtyRef.current = isDirty;
  }, [isDirty]);

  useEffect(() => {
    isSavingRef.current = isSaving;
  }, [isSaving]);

  const load = useCallback(
    async (authToken: string) => {
      const reportResponse = await fetchSafetyReportById(authToken, documentId);
      reportRef.current = reportResponse;
      setReport(reportResponse);
      setDraftTitle(reportResponse.report_title);
      setDraftVisitDate(reportResponse.visit_date ?? '');
      setDraftPayload(reportResponse.payload ?? {});
      setLastAutosavedAt(reportResponse.last_autosaved_at ?? reportResponse.updated_at ?? null);
      setLastManualSavedAt(
        reportResponse.status !== 'draft' ? reportResponse.updated_at ?? null : null
      );
      setReissuedPendingLinks([]);
      setSaveActivity(null);
      draftVersionRef.current = 0;
      isDirtyRef.current = false;
      pendingAutosaveRef.current = false;
      setIsDirty(false);

      const draftContextPromise = reportResponse.document_kind
        ? fetchSafetyReportDraftContext(
            authToken,
            reportResponse.site_id,
            reportResponse.document_kind,
            reportResponse.id
          ).catch(() => null)
        : Promise.resolve(null);
      const siteWorkersPromise = fetchSiteWorkers(authToken, {
        siteId: reportResponse.site_id,
        limit: 1000,
      }).catch(() => []);

      const [dashboardResult, contentResult, draftContextResult, siteWorkersResult] = await Promise.allSettled([
        fetchSafetySiteDashboard(authToken, reportResponse.site_id),
        fetchSafetyContentItems(authToken),
        draftContextPromise,
        siteWorkersPromise,
      ]);

      if (dashboardResult.status === 'fulfilled') {
        setDashboard(dashboardResult.value);
      }
      if (contentResult.status === 'fulfilled') {
        setContentItems(
          contentResult.value.filter((item) => getTemplateTypesForDocuments().includes(item.content_type))
        );
      }
      if (draftContextResult.status === 'fulfilled') {
        setDraftContext(draftContextResult.value);
      }
      if (siteWorkersResult.status === 'fulfilled') {
        setSiteWorkers(siteWorkersResult.value);
      }
    },
    [documentId]
  );

  useEffect(() => {
    if (!token || !isAuthenticated) return;

    let isDisposed = false;
    const run = async () => {
      setIsLoading(true);
      setError(null);

      try {
        await load(token);
      } catch (nextError) {
        if (!isDisposed) {
          setError(getErrorMessage(nextError));
        }
      } finally {
        if (!isDisposed) {
          setIsLoading(false);
        }
      }
    };

    void run();

    return () => {
      isDisposed = true;
    };
  }, [isAuthenticated, load, token]);

  const documentKind = report?.document_kind ?? null;
  const normalizedPayload = useMemo(() => {
    if (!documentKind) return null;
    return normalizePayloadForKind(documentKind, draftPayload);
  }, [documentKind, draftPayload]);
  const templatePreview = useMemo(
    () => (documentKind ? getTemplatePreview(contentItems, documentKind) : []),
    [contentItems, documentKind]
  );
  const contextualTemplatePreview = useMemo(
    () => mergeUniqueStrings(templatePreview, draftContext?.template_items ?? []),
    [draftContext?.template_items, templatePreview]
  );
  const mobileAcknowledgements = useMemo(() => {
    return normalizeMobileAcknowledgements(asRecord(draftPayload).mobileAcknowledgements);
  }, [draftPayload]);
  const mobileAcknowledgementCounts = useMemo(() => {
    return mobileAcknowledgements.reduce<Record<string, number>>((accumulator, item) => {
      const key = item.kind ?? 'unknown';
      accumulator[key] = (accumulator[key] ?? 0) + 1;
      return accumulator;
    }, {});
  }, [mobileAcknowledgements]);
  const currentDocumentKindLabel = documentKind ? ERP_DOCUMENT_KIND_LABELS[documentKind] : '문서';
  const latestDocumentForKind = useMemo(
    () =>
      documentKind
        ? dashboard?.latest_documents.find((item) => item.document_kind === documentKind) ?? null
        : null,
    [dashboard?.latest_documents, documentKind]
  );
  const mobileAckField = documentKind ? WORKER_ACK_FIELD_BY_KIND[documentKind] ?? null : null;
  const mobileAckKind =
    mobileAckField && documentKind
      ? (documentKind as WorkerAckDrilldownKind)
      : null;
  const isLatestMobileAcknowledgementDocument = useMemo(() => {
    if (!report || !documentKind || !mobileAckField) return false;
    return latestDocumentForKind?.report_id === report.id;
  }, [documentKind, latestDocumentForKind, mobileAckField, report]);
  const activeSiteWorkers = useMemo(
    () => siteWorkers.filter((worker) => !worker.is_blocked),
    [siteWorkers]
  );
  const eligibleMobileAckWorkers = useMemo(() => {
    if (!mobileAckKind) return activeSiteWorkers;
    return activeSiteWorkers.filter((worker) => isWorkerAckTarget(worker, mobileAckKind));
  }, [activeSiteWorkers, mobileAckKind]);
  const excludedMobileAckCount = useMemo(() => {
    return Math.max(activeSiteWorkers.length - eligibleMobileAckWorkers.length, 0);
  }, [activeSiteWorkers.length, eligibleMobileAckWorkers.length]);
  const pendingMobileAckWorkers = useMemo(() => {
    if (!report || !mobileAckField || !isLatestMobileAcknowledgementDocument) return [];
    const reportUpdatedAt = report.updated_at ?? report.submitted_at ?? report.created_at ?? null;
    return eligibleMobileAckWorkers.filter((worker) => {
      const acknowledgedAt = worker[mobileAckField];
      return !acknowledgedAt || (reportUpdatedAt ? acknowledgedAt < reportUpdatedAt : true);
    });
  }, [eligibleMobileAckWorkers, isLatestMobileAcknowledgementDocument, mobileAckField, report]);
  const completedMobileAckCount = useMemo(() => {
    if (!mobileAckField) return 0;
    return Math.max(eligibleMobileAckWorkers.length - pendingMobileAckWorkers.length, 0);
  }, [eligibleMobileAckWorkers.length, mobileAckField, pendingMobileAckWorkers.length]);
  const validationIssues = useMemo(() => {
    if (!documentKind || !normalizedPayload) return [];
    return validateErpDocument(documentKind, draftTitle, normalizedPayload);
  }, [documentKind, draftTitle, normalizedPayload]);
  const isReadOnly = report?.status !== 'draft';
  const isResumeAvailable = report?.status === 'submitted';
  const saveStatusDescription = useMemo(() => {
    if (isUploadingPhotos) return '사진 업로드 중';
    if (isSaving) {
      if (saveActivity === 'autosave') return '자동저장 중';
      if (saveActivity === 'manual_save') return '수동 저장 중';
      if (saveActivity === 'status') return '상태 변경 중';
      return '저장 중';
    }
    if (isReadOnly) {
      return '읽기전용 상태';
    }
    if (isDirty) {
      return '저장 대기 중';
    }
    return '편집 가능';
  }, [isDirty, isReadOnly, isSaving, isUploadingPhotos, saveActivity]);

  const updatePayload = <T extends object>(updater: (current: T) => T) => {
    setDraftPayload((current) => {
      const next = updater(current as T);
      return next as Record<string, unknown>;
    });
    draftVersionRef.current += 1;
    isDirtyRef.current = true;
    setIsDirty(true);
  };

  const markDraftDirty = useCallback(() => {
    draftVersionRef.current += 1;
    isDirtyRef.current = true;
    setIsDirty(true);
  }, []);

  const saveDocument = useCallback(
    async (
      reason: 'autosave' | 'manual_save' = 'manual_save',
      options: SaveDocumentOptions = {}
    ) => {
      if (!token || !report || !documentKind || isReadOnly) return null;
      if (reason === 'autosave' && isSavingRef.current) {
        pendingAutosaveRef.current = true;
        return null;
      }

      const draftVersionAtSaveStart = draftVersionRef.current;
      const shouldUpdateUi = isMountedRef.current && !options.background;
      isSavingRef.current = true;

      if (shouldUpdateUi) {
        setIsSaving(true);
        setSaveActivity(reason);
        setError(null);
      }

      try {
        const saved = await upsertSafetyReport(token, {
          report_key: report.report_key,
          report_title: draftTitle.trim() || report.report_title,
          site_id: report.site_id,
          headquarter_id: report.headquarter_id,
          assigned_user_id: report.assigned_user_id,
          visit_date: draftVisitDate || null,
          visit_round: report.visit_round,
          total_round: report.total_round,
          progress_rate: report.progress_rate,
          document_kind: documentKind,
          payload: {
            ...buildReportPayloadForSave(draftPayload),
            meta: {
              savedFrom: 'erp_workspace',
            },
          },
          meta: {
            ...(report.meta ?? {}),
            documentKind: documentKind,
            siteName: dashboard?.site.site_name ?? report.meta?.siteName,
          },
          status: report.status,
          create_revision: false,
          revision_reason: reason,
        });

        reportRef.current = saved;
        const draftChangedDuringSave = draftVersionRef.current !== draftVersionAtSaveStart;
        if (isMountedRef.current) {
          setReport(saved);
          if (!draftChangedDuringSave) {
            setDraftTitle(saved.report_title);
            setDraftVisitDate(saved.visit_date ?? '');
            setDraftPayload(saved.payload ?? {});
            isDirtyRef.current = false;
            setIsDirty(false);
          }
          if (reason === 'autosave') {
            setLastAutosavedAt(saved.last_autosaved_at ?? saved.updated_at ?? null);
          } else {
            setLastManualSavedAt(saved.updated_at ?? null);
          }
        } else if (!draftChangedDuringSave) {
          isDirtyRef.current = false;
        }
        if (!shouldUpdateUi) {
          return saved;
        }
        setNotice(reason === 'autosave' ? '자동저장되었습니다.' : '문서를 저장했습니다.');
        return saved;
      } catch (nextError) {
        if (shouldUpdateUi && isMountedRef.current) {
          setError(getErrorMessage(nextError));
        }
        return null;
      } finally {
        isSavingRef.current = false;
        if (shouldUpdateUi && isMountedRef.current) {
          setIsSaving(false);
          setSaveActivity(null);
        }
        if (pendingAutosaveRef.current && isDirtyRef.current && tokenRef.current && reportRef.current) {
          pendingAutosaveRef.current = false;
          void saveDocumentRef.current?.('autosave', options);
        }
      }
    },
    [dashboard?.site.site_name, documentKind, draftPayload, draftTitle, draftVisitDate, isReadOnly, report, token]
  );

  useEffect(() => {
    saveDocumentRef.current = saveDocument;
  }, [saveDocument]);

  useEffect(() => {
    if (!isDirty || !report || !documentKind || isReadOnly || isSaving) return;

    const timeoutId = window.setTimeout(() => {
      void saveDocument('autosave');
    }, ERP_AUTOSAVE_DEBOUNCE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [documentKind, isDirty, isReadOnly, isSaving, report, saveDocument]);

  useEffect(() => {
    const flushAutosave = () => {
      if (!isDirtyRef.current || !tokenRef.current || !reportRef.current) return;
      if (isSavingRef.current) {
        pendingAutosaveRef.current = true;
        return;
      }
      void saveDocumentRef.current?.('autosave', { background: true });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        flushAutosave();
      }
    };

    const handlePageHide = () => {
      flushAutosave();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('beforeunload', handlePageHide);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('beforeunload', handlePageHide);
      flushAutosave();
      isMountedRef.current = false;
    };
  }, []);

  const finalizeDocument = async () => {
    if (!token || !report || isReadOnly) return;
    if (validationIssues.length > 0) {
      setError('필수 항목을 먼저 입력한 뒤 최종확정해 주세요.');
      setNotice(null);
      return;
    }
    const saved = await saveDocument('manual_save');
    if (!saved) return;

    setIsSaving(true);
    setSaveActivity('status');
    setError(null);

    try {
      const finalized = await updateSafetyReportStatus(token, saved.id, {
        status: 'submitted',
        create_revision: true,
        revision_reason: 'submit',
      });

      setReport(finalized);
      setDraftPayload(finalized.payload ?? {});
      setLastManualSavedAt(finalized.updated_at ?? null);
      setNotice('문서를 최종확정했습니다.');
    } catch (nextError) {
      setError(getErrorMessage(nextError));
    } finally {
      setIsSaving(false);
      setSaveActivity(null);
    }
  };

  const handleFinalize = async (forceWithPendingWorkers = false) => {
    if (!token || !report || isReadOnly) return;
    if (
      !forceWithPendingWorkers &&
      mobileAckField &&
      isLatestMobileAcknowledgementDocument &&
      pendingMobileAckWorkers.length > 0
    ) {
      setIsFinalizeWarningOpen(true);
      setError(null);
      setNotice(null);
      return;
    }

    setIsFinalizeWarningOpen(false);
    await finalizeDocument();
  };

  const handleResumeEditing = async () => {
    if (!token || !report || !isResumeAvailable) return;

    setIsSaving(true);
    setSaveActivity('status');
    setError(null);

    try {
      const reopened = await updateSafetyReportStatus(token, report.id, {
        status: 'draft',
        create_revision: false,
        revision_reason: 'manual_save',
      });

      setReport(reopened);
      setDraftPayload(reopened.payload ?? {});
      setIsDirty(false);
      setNotice('편집 재개 상태로 전환했습니다.');
    } catch (nextError) {
      setError(getErrorMessage(nextError));
    } finally {
      setIsSaving(false);
      setSaveActivity(null);
    }
  };

  const handleDownloadAcknowledgementsCsv = () => {
    if (!report || !dashboard || mobileAcknowledgements.length === 0) return;

    const rows = [
      ['site_name', 'document_title', 'document_kind', 'worker_name', 'signature_name', 'acknowledged_at', 'note', 'signature_data'],
      ...mobileAcknowledgements.map((item) => [
        dashboard.site.site_name,
        draftTitle || report.report_title,
        item.kind ? ERP_DOCUMENT_KIND_LABELS[item.kind] : currentDocumentKindLabel,
        item.worker_name ?? '',
        item.signature_name ?? '',
        item.acknowledged_at ?? '',
        item.note ?? '',
        item.signature_data ?? '',
      ]),
    ];

    downloadCsvFile(
      `${dashboard.site.site_name}-${draftTitle || report.report_title}-mobile-acks.csv`,
      rows
    );
  };

  const handleDownloadPendingWorkersCsv = () => {
    if (!report || !dashboard || pendingMobileAckWorkers.length === 0) return;

    const rows = [
      ['site_name', 'document_title', 'document_kind', 'worker_name', 'company_name', 'trade', 'phone'],
      ...pendingMobileAckWorkers.map((worker) => [
        dashboard.site.site_name,
        draftTitle || report.report_title,
        currentDocumentKindLabel,
        worker.name,
        worker.company_name ?? '',
        worker.trade ?? '',
        worker.phone ?? '',
      ]),
    ];

    downloadCsvFile(
      `${dashboard.site.site_name}-${draftTitle || report.report_title}-pending-workers.csv`,
      rows
    );
  };

  const handleDownloadReissuedLinksCsv = () => {
    if (!report || !dashboard || reissuedPendingLinks.length === 0) return;

    const rows = [
      ['site_name', 'document_title', 'document_kind', 'worker_name', 'company_name', 'trade', 'phone', 'entry_url', 'expires_at'],
      ...reissuedPendingLinks.map((item) => [
        dashboard.site.site_name,
        draftTitle || report.report_title,
        currentDocumentKindLabel,
        item.worker.name,
        item.worker.company_name ?? '',
        item.worker.trade ?? '',
        item.worker.phone ?? '',
        buildAbsoluteEntryUrl(item.session.entry_url),
        item.session.expires_at,
      ]),
    ];

    downloadCsvFile(
      `${dashboard.site.site_name}-${draftTitle || report.report_title}-reissued-links.csv`,
      rows
    );
  };

  const handleCopyReissuedEntryUrl = async (entryUrl: string) => {
    if (typeof navigator === 'undefined' || !navigator.clipboard) return;
    await navigator.clipboard.writeText(buildAbsoluteEntryUrl(entryUrl)).catch(() => undefined);
  };

  const handleReissuePendingLinks = async () => {
    if (!token || pendingMobileAckWorkers.length === 0) return;

    setIsReissuingPendingLinks(true);
    setError(null);
    setNotice(null);

    try {
      const results = await Promise.allSettled(
        pendingMobileAckWorkers.map(async (worker) => ({
          worker,
          session: await createSiteWorkerMobileSession(token, worker.id),
        }))
      );

      const successes = results.flatMap((result) =>
        result.status === 'fulfilled' ? [result.value] : []
      );
      const failures = results.filter((result) => result.status === 'rejected');

      if (successes.length === 0) {
        throw new Error('미확인 인원에게 모바일 링크를 재발급하지 못했습니다.');
      }

      setReissuedPendingLinks(successes);
      setNotice(
        failures.length > 0
          ? `미확인 인원 ${pendingMobileAckWorkers.length}명 중 ${successes.length}명에게 링크를 재발급했습니다. 실패 ${failures.length}건은 출입자관리에서 확인해 주세요.`
          : `미확인 인원 ${successes.length}명에게 모바일 링크를 재발급했습니다.`
      );
    } catch (nextError) {
      setError(getErrorMessage(nextError));
    } finally {
      setIsReissuingPendingLinks(false);
    }
  };

  const handleGenerateAiDraft = async () => {
    if (!documentKind || !dashboard) return;

    setIsSuggesting(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/erp-draft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentKind,
          site: {
            siteName: dashboard.site.site_name,
            address: dashboard.site.site_address,
            managerName: dashboard.site.manager_name,
          },
          draftContext: {
            previousDocument: draftContext?.previous_document
              ? {
                  title: draftContext.previous_document.report.report_title,
                  updatedAt: draftContext.previous_document.report.updated_at,
                  summaryItems: draftContext.previous_document.summary_items,
                }
              : null,
            recentDocuments:
              draftContext?.recent_documents.map((item) => ({
                title: item.report.report_title,
                kind: item.report.document_kind,
                updatedAt: item.report.updated_at,
                summaryItems: item.summary_items,
              })) ??
              dashboard.latest_documents.map((item) => ({
                title: item.report_title,
                kind: item.document_kind,
                updatedAt: item.updated_at,
                summaryItems: [],
              })),
            templateItems: contextualTemplatePreview,
            unresolvedItems:
              draftContext?.unresolved_items ?? [
                `미확인 공지 ${dashboard.unacknowledged_notice_count}명`,
                `TBM 미서명 ${dashboard.unsigned_tbm_count}명`,
                `교육 미이수 ${dashboard.incomplete_education_count}명`,
              ],
            recentPayload: draftContext?.recent_payload ?? {},
            unresolvedPayload: draftContext?.unresolved_payload ?? {},
            workerSummary: draftContext
              ? {
                  registeredCount: draftContext.worker_summary.registered_count,
                  activeCount: draftContext.worker_summary.active_count,
                  tradeNames: draftContext.worker_summary.trade_names,
                  companyNames: draftContext.worker_summary.company_names,
                  workerNames: draftContext.worker_summary.worker_names,
                  employmentBreakdown: draftContext.worker_summary.employment_breakdown,
                }
              : undefined,
          },
        }),
      });

      const data = (await response.json()) as AiDraftSuggestion & { error?: string };
      if (!response.ok) {
        throw new Error(data.error || 'AI 초안을 생성하지 못했습니다.');
      }

      setAiSuggestion({
        title: data.title || '',
        summary: data.summary || '',
        bullet_items: Array.isArray(data.bullet_items) ? data.bullet_items : [],
        cautions: Array.isArray(data.cautions) ? data.cautions : [],
      });
    } catch (nextError) {
      setError(getErrorMessage(nextError));
    } finally {
      setIsSuggesting(false);
    }
  };

  const applyAiSuggestion = () => {
    if (!aiSuggestion || !documentKind) return;

    if (aiSuggestion.title.trim()) {
      setDraftTitle((current) => current || aiSuggestion.title.trim());
    }

    updatePayload<Record<string, unknown>>((current) => {
      const next = { ...current };

      if (documentKind === 'tbm') {
        next.topic = aiSuggestion.title || current.topic || '';
        next.riskFactors = aiSuggestion.bullet_items;
        next.countermeasures = aiSuggestion.cautions;
      } else if (documentKind === 'hazard_notice') {
        next.title = aiSuggestion.title || current.title || '';
        next.content = aiSuggestion.summary || current.content || '';
        next.noticeItems = aiSuggestion.bullet_items;
      } else if (documentKind === 'safety_education') {
        next.educationName = aiSuggestion.title || current.educationName || '';
        next.materialSummary = aiSuggestion.summary || current.materialSummary || '';
        next.agenda = aiSuggestion.bullet_items;
      } else if (documentKind === 'safety_work_log') {
        next.mainTasks = aiSuggestion.bullet_items;
        next.issues = aiSuggestion.cautions;
      } else {
        next.checklist = aiSuggestion.bullet_items.map((item) => ({
          item,
          status: 'warning',
          note: '',
        }));
        next.actions = aiSuggestion.cautions;
      }

      return next;
    });
  };

  const applyDraftContextPayload = (
    source: 'recent' | 'unresolved',
    payload: Record<string, unknown>,
    nextNotice: string
  ) => {
    if (!documentKind) return;

    if (source === 'recent' && !draftTitle.trim()) {
      const previousTitle = draftContext?.previous_document?.report.report_title?.trim();
      if (previousTitle) {
        setDraftTitle(previousTitle);
      }
    }

    updatePayload<Record<string, unknown>>((current) =>
      mergeDraftPayload(documentKind, current, payload)
    );
    setNotice(nextNotice);
    setError(null);
  };

  const handleApplyRecentData = () => {
    if (!draftContext || !documentKind) return;
    applyDraftContextPayload(
      'recent',
      draftContext.recent_payload,
      '최근 ERP 데이터를 현재 문서 초안에 반영했습니다.'
    );
  };

  const handleApplyUnresolvedItems = () => {
    if (!draftContext || !documentKind) return;
    applyDraftContextPayload(
      'unresolved',
      draftContext.unresolved_payload,
      '최근 미조치 항목을 현재 문서 초안에 반영했습니다.'
    );
  };

  const handleUploadPhotos = async (files: FileList | null) => {
    if (!files || !documentKind || isReadOnly) return;
    if (
      documentKind !== 'safety_work_log' &&
      documentKind !== 'safety_inspection_log' &&
      documentKind !== 'patrol_inspection_log'
    ) {
      return;
    }

    const uploads = Array.from(files);
    if (uploads.length === 0) return;

    setIsUploadingPhotos(true);
    setError(null);

    try {
      const uploadedUrls: string[] = [];
      for (const file of uploads) {
        if (!file.type.startsWith('image/')) {
          throw new Error('사진 업로드는 이미지 파일만 지원합니다.');
        }
        const validationMessage = validateSafetyAssetFile(file);
        if (validationMessage) {
          throw new Error(validationMessage);
        }
        const uploaded = await uploadSafetyAssetFile(file);
        uploadedUrls.push(uploaded.url);
      }

      if (documentKind === 'safety_work_log') {
        updatePayload<SafetyWorkLogPayload>((current) => ({
          ...normalizePayloadForKind('safety_work_log', current),
          photos: mergeUniqueStrings(
            normalizePayloadForKind('safety_work_log', current).photos,
            uploadedUrls
          ),
        }));
      } else {
        updatePayload<SafetyInspectionPayload>((current) => ({
          ...normalizePayloadForKind(
            documentKind === 'patrol_inspection_log'
              ? 'patrol_inspection_log'
              : 'safety_inspection_log',
            current
          ),
          photos: mergeUniqueStrings(
            normalizePayloadForKind(
              documentKind === 'patrol_inspection_log'
                ? 'patrol_inspection_log'
                : 'safety_inspection_log',
              current
            ).photos,
            uploadedUrls
          ),
        }));
      }

      setNotice(`${uploadedUrls.length}개의 사진을 업로드했습니다. 자동저장됩니다.`);
    } catch (nextError) {
      setError(getErrorMessage(nextError));
    } finally {
      setIsUploadingPhotos(false);
      if (photoInputRef.current) {
        photoInputRef.current.value = '';
      }
    }
  };

  const handleRemovePhoto = (photoUrl: string) => {
    if (!documentKind || isReadOnly) return;

    if (documentKind === 'safety_work_log') {
      updatePayload<SafetyWorkLogPayload>((current) => ({
        ...normalizePayloadForKind('safety_work_log', current),
        photos: normalizePayloadForKind('safety_work_log', current).photos.filter(
          (item) => item !== photoUrl
        ),
      }));
      return;
    }

    if (
      documentKind === 'safety_inspection_log' ||
      documentKind === 'patrol_inspection_log'
    ) {
      updatePayload<SafetyInspectionPayload>((current) => ({
        ...normalizePayloadForKind(
          documentKind === 'patrol_inspection_log'
            ? 'patrol_inspection_log'
            : 'safety_inspection_log',
          current
        ),
        photos: normalizePayloadForKind(
          documentKind === 'patrol_inspection_log'
            ? 'patrol_inspection_log'
            : 'safety_inspection_log',
          current
        ).photos.filter((item) => item !== photoUrl),
      }));
    }
  };

  if (shouldShowLogin) {
    return (
      <LoginPanel
        error={authError}
        onSubmit={login}
        title="ERP 문서 편집 로그인"
        description="관리직 계정으로 로그인한 뒤 문서를 편집하고 자동저장할 수 있습니다."
      />
    );
  }

  if (!isReady || (isAuthenticated && isLoading && !report)) {
    return (
      <main className="app-page">
        <div className="app-container">
          <section className="app-shell">
            <div className={styles.emptyState}>
              <p className={styles.emptyTitle}>문서를 불러오는 중입니다.</p>
            </div>
          </section>
        </div>
      </main>
    );
  }

  if (!report || !dashboard || !documentKind || !normalizedPayload) {
    return (
      <main className="app-page">
        <div className="app-container">
          <section className="app-shell">
            <div className={styles.emptyState}>
              <p className={styles.emptyTitle}>ERP 문서를 열 수 없습니다.</p>
              <p className={styles.emptyDescription}>
                {error ?? '이 문서는 ERP 문서가 아니거나 접근 권한이 없습니다.'}
              </p>
            </div>
          </section>
        </div>
      </main>
    );
  }

  const currentSite = dashboard.site;
  const tbmPayload = documentKind === 'tbm' ? (normalizedPayload as TbmDocumentPayload) : null;
  const noticePayload =
    documentKind === 'hazard_notice'
      ? (normalizedPayload as HazardNoticePayload)
      : null;
  const educationPayload =
    documentKind === 'safety_education'
      ? (normalizedPayload as SafetyEducationPayload)
      : null;
  const workLogPayload =
    documentKind === 'safety_work_log'
      ? (normalizedPayload as SafetyWorkLogPayload)
      : null;
  const inspectionPayload =
    documentKind === 'safety_inspection_log' || documentKind === 'patrol_inspection_log'
      ? (normalizedPayload as SafetyInspectionPayload)
      : null;
  const inspectionKind =
    documentKind === 'patrol_inspection_log'
      ? 'patrol_inspection_log'
      : 'safety_inspection_log';
  const signatureKind = documentKind === 'tbm' ? 'tbm' : 'safety_education';
  const signaturePayload = tbmPayload ?? educationPayload;
  const pendingWorkersHref =
    mobileAckKind
      ? buildSiteWorkersHref(currentSite.id, {
          ackKind: mobileAckKind,
          pendingOnly: true,
          autoSelectPending: true,
        })
      : buildSiteWorkersHref(currentSite.id);

  return (
    <ErpSiteShell
      actions={
        <>
          {!isReadOnly ? (
            <>
              <button
                type="button"
                className="app-button app-button-secondary"
                onClick={handleApplyRecentData}
                disabled={!draftContext?.previous_document || isSaving || isUploadingPhotos}
              >
                최근 데이터 불러오기
              </button>
              <button
                type="button"
                className="app-button app-button-secondary"
                onClick={handleApplyUnresolvedItems}
                disabled={!draftContext?.unresolved_items.length || isSaving || isUploadingPhotos}
              >
                미조치 항목 가져오기
              </button>
              <button
                type="button"
                className="app-button app-button-secondary"
                onClick={() => void saveDocument('manual_save')}
                disabled={isSaving || isUploadingPhotos}
              >
                {isSaving && saveActivity === 'manual_save' ? '저장 중...' : '즉시 저장'}
              </button>
              <button
                type="button"
                className="app-button app-button-secondary"
                onClick={handleGenerateAiDraft}
                disabled={isSuggesting || isSaving || isUploadingPhotos}
              >
                {isSuggesting ? 'AI 생성 중...' : 'AI 초안 제안'}
              </button>
              <button
                type="button"
                className="app-button app-button-accent"
                onClick={() => void handleFinalize()}
                disabled={isSaving || isUploadingPhotos}
              >
                최종확정
              </button>
            </>
          ) : null}
          {isResumeAvailable ? (
            <button
              type="button"
              className="app-button app-button-secondary"
              onClick={handleResumeEditing}
              disabled={isSaving}
            >
              편집 재개
            </button>
          ) : null}
          <button
            type="button"
            className="app-button app-button-primary"
            onClick={() => window.print()}
          >
            인쇄 / PDF
          </button>
        </>
      }
      currentUserName={currentUser?.name}
      description={`${ERP_DOCUMENT_KIND_LABELS[documentKind]} 문서를 자동저장 기반으로 편집하고 인쇄용 화면까지 같은 데이터로 사용합니다.`}
      heroMeta={
        <>
          <span className={styles.badge}>{currentSite.site_name}</span>
          <span className={styles.badge}>{ERP_DOCUMENT_KIND_LABELS[documentKind]}</span>
          <span className={styles.badge}>{ERP_REPORT_STATUS_LABELS[report.status]}</span>
          <span className={styles.badge}>{formatErpDateTime(report.updated_at)}</span>
          {isReadOnly ? <span className={`${styles.badge} ${styles.badgeWarning}`}>읽기전용</span> : null}
        </>
      }
      menuItems={[
        {
          label: '현장 대시보드',
          description: currentSite.site_name,
          href: buildSiteDashboardHref(currentSite.id),
        },
        {
          label: '출입자관리',
          description: '모바일 링크와 인원 관리',
          href: buildSiteWorkersHref(currentSite.id),
        },
        {
          label: '일일 안전관리',
          description: '문서 보드로 돌아가기',
          href: buildSiteSafetyHref(currentSite.id),
          active: true,
        },
      ]}
      onLogout={logout}
      tabs={[
        { href: buildSiteDashboardHref(currentSite.id), label: '현장 대시보드' },
        { href: buildSiteWorkersHref(currentSite.id), label: '출입자관리' },
        { href: buildSiteSafetyHref(currentSite.id), label: '일일 안전관리' },
      ]}
      title={draftTitle || report.report_title}
    >
      <AppModal
        open={isFinalizeWarningOpen}
        title="미확인 인원이 남아 있습니다."
        onClose={() => {
          if (isSaving) return;
          setIsFinalizeWarningOpen(false);
        }}
        actions={
          <>
            <button
              type="button"
              className="app-button app-button-secondary"
              onClick={() => setIsFinalizeWarningOpen(false)}
              disabled={isSaving}
            >
              취소
            </button>
            <button
              type="button"
              className="app-button app-button-accent"
              onClick={() => void handleFinalize(true)}
              disabled={isSaving}
            >
              그래도 최종확정
            </button>
          </>
        }
      >
        <div className={styles.fieldGrid}>
          <p className={styles.sectionDescription}>
            최신 {currentDocumentKindLabel} 문서 기준으로 아직 확인하지 않은 출입자가
            {` ${pendingMobileAckWorkers.length}명 `}
            남아 있습니다. 지금 최종확정하면 문서는 마감되지만, 근로자 확인 누락은 그대로 유지됩니다.
          </p>
          <div className={styles.inlineStats}>
            <span className={styles.badge}>대상 {eligibleMobileAckWorkers.length}명</span>
            <span className={`${styles.badge} ${styles.badgePublished}`}>
              완료 {completedMobileAckCount}명
            </span>
            <span className={`${styles.badge} ${styles.badgeWarning}`}>
              미확인 {pendingMobileAckWorkers.length}명
            </span>
            {excludedMobileAckCount > 0 ? (
              <span className={styles.badge}>제외 {excludedMobileAckCount}명</span>
            ) : null}
          </div>
          <div className={styles.textList}>
            {pendingMobileAckWorkers.slice(0, 8).map((worker) => (
              <div key={worker.id} className={styles.textListItem}>
                <span className={styles.textListBullet}>•</span>
                <span>
                  {worker.name}
                  {worker.company_name ? ` / ${worker.company_name}` : ''}
                  {worker.trade ? ` / ${worker.trade}` : ''}
                  {worker.phone ? ` / ${worker.phone}` : ''}
                </span>
              </div>
            ))}
          </div>
          {pendingMobileAckWorkers.length > 8 ? (
            <p className={styles.helperText}>
              외 {pendingMobileAckWorkers.length - 8}명은 출입자관리에서 전체 목록을 확인할 수 있습니다.
            </p>
          ) : null}
        </div>
      </AppModal>

      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={(event) => void handleUploadPhotos(event.target.files)}
      />

      {(error || notice || aiSuggestion) && (
        <section className={styles.sectionCard}>
          <div className={styles.sectionBody}>
            {error ? (
              <div className={styles.emptyState}>
                <p className={styles.emptyTitle}>편집 중 알림</p>
                <p className={styles.emptyDescription}>{error}</p>
              </div>
            ) : null}
            {notice ? (
              <div className={styles.emptyState}>
                <p className={styles.emptyTitle}>저장 상태</p>
                <p className={styles.emptyDescription}>{notice}</p>
              </div>
            ) : null}
            {aiSuggestion ? (
              <div className={styles.emptyState}>
                <p className={styles.emptyTitle}>AI 초안 제안</p>
                <p className={styles.emptyDescription}>{aiSuggestion.summary || '요약 문구 없음'}</p>
                <div className={styles.textList}>
                  {aiSuggestion.bullet_items.map((item) => (
                    <div key={item} className={styles.textListItem}>
                      <span className={styles.textListBullet}>•</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.sectionActions}>
                  <button
                    type="button"
                    className="app-button app-button-primary"
                    onClick={applyAiSuggestion}
                    disabled={isReadOnly}
                  >
                    초안 적용
                  </button>
                  <button
                    type="button"
                    className="app-button app-button-secondary"
                    onClick={() => setAiSuggestion(null)}
                  >
                    닫기
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </section>
      )}

      <div className={styles.splitGrid}>
        <section className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionHeaderMain}>
              <h2 className={styles.sectionTitle}>문서 기본정보</h2>
              <p className={styles.sectionDescription}>
                문서 제목과 기준일을 조정하면 자동저장에 바로 반영됩니다.
              </p>
            </div>
          </div>
          <div className={styles.sectionBody}>
            <fieldset
              disabled={isReadOnly || isUploadingPhotos}
              style={{ border: 0, margin: 0, minWidth: 0, padding: 0, display: 'grid', gap: 16 }}
            >
            <div className={`${styles.fieldGrid} ${styles.fieldGridCols2}`}>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>문서 제목</span>
                <input
                  className="app-input"
                  value={draftTitle}
                  onChange={(event) => {
                    setDraftTitle(event.target.value);
                    markDraftDirty();
                  }}
                />
              </label>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>기준일</span>
                <input
                  type="date"
                  className="app-input"
                  value={draftVisitDate}
                  onChange={(event) => {
                    setDraftVisitDate(event.target.value);
                    markDraftDirty();
                  }}
                />
              </label>
            </div>

            {tbmPayload ? (
              <>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>작업 주제</span>
                  <input
                    className="app-input"
                    value={tbmPayload.topic}
                    onChange={(event) =>
                      updatePayload<TbmDocumentPayload>((current) => ({
                        ...normalizePayloadForKind('tbm', current),
                        topic: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>위험요인</span>
                  <textarea
                    className="app-textarea"
                    value={fromLineItems(tbmPayload.riskFactors)}
                    onChange={(event) =>
                      updatePayload<TbmDocumentPayload>((current) => ({
                        ...normalizePayloadForKind('tbm', current),
                        riskFactors: toLineItems(event.target.value),
                      }))
                    }
                  />
                </label>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>대책</span>
                  <textarea
                    className="app-textarea"
                    value={fromLineItems(tbmPayload.countermeasures)}
                    onChange={(event) =>
                      updatePayload<TbmDocumentPayload>((current) => ({
                        ...normalizePayloadForKind('tbm', current),
                        countermeasures: toLineItems(event.target.value),
                      }))
                    }
                  />
                </label>
              </>
            ) : null}

            {noticePayload ? (
              <>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>공지 제목</span>
                  <input
                    className="app-input"
                    value={noticePayload.title}
                    onChange={(event) =>
                      updatePayload<HazardNoticePayload>((current) => ({
                        ...normalizePayloadForKind('hazard_notice', current),
                        title: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>공지 내용</span>
                  <textarea
                    className="app-textarea"
                    value={noticePayload.content}
                    onChange={(event) =>
                      updatePayload<HazardNoticePayload>((current) => ({
                        ...normalizePayloadForKind('hazard_notice', current),
                        content: event.target.value,
                      }))
                    }
                  />
                </label>
                <div className={`${styles.fieldGrid} ${styles.fieldGridCols2}`}>
                  <label className={styles.field}>
                    <span className={styles.fieldLabel}>대상 공종</span>
                    <textarea
                      className="app-textarea"
                      value={fromLineItems(noticePayload.targetTrades)}
                      onChange={(event) =>
                        updatePayload<HazardNoticePayload>((current) => ({
                          ...normalizePayloadForKind('hazard_notice', current),
                          targetTrades: toLineItems(event.target.value),
                        }))
                      }
                    />
                  </label>
                  <div className={styles.fieldGrid}>
                    <label className={styles.field}>
                      <span className={styles.fieldLabel}>게시 시작일</span>
                      <input
                        type="date"
                        className="app-input"
                        value={noticePayload.effectiveFrom ?? ''}
                        onChange={(event) =>
                          updatePayload<HazardNoticePayload>((current) => ({
                            ...normalizePayloadForKind('hazard_notice', current),
                            effectiveFrom: event.target.value || null,
                          }))
                        }
                      />
                    </label>
                    <label className={styles.field}>
                      <span className={styles.fieldLabel}>게시 종료일</span>
                      <input
                        type="date"
                        className="app-input"
                        value={noticePayload.effectiveTo ?? ''}
                        onChange={(event) =>
                          updatePayload<HazardNoticePayload>((current) => ({
                            ...normalizePayloadForKind('hazard_notice', current),
                            effectiveTo: event.target.value || null,
                          }))
                        }
                      />
                    </label>
                  </div>
                </div>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>핵심 안내 항목</span>
                  <textarea
                    className="app-textarea"
                    value={fromLineItems(noticePayload.noticeItems)}
                    onChange={(event) =>
                      updatePayload<HazardNoticePayload>((current) => ({
                        ...normalizePayloadForKind('hazard_notice', current),
                        noticeItems: toLineItems(event.target.value),
                      }))
                    }
                  />
                </label>
              </>
            ) : null}

            {educationPayload ? (
              <>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>교육명</span>
                  <input
                    className="app-input"
                    value={educationPayload.educationName}
                    onChange={(event) =>
                      updatePayload<Record<string, unknown>>((current) => ({
                        ...normalizePayloadForKind('safety_education', current),
                        educationName: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>교육 자료 요약</span>
                  <textarea
                    className="app-textarea"
                    value={educationPayload.materialSummary}
                    onChange={(event) =>
                      updatePayload<Record<string, unknown>>((current) => ({
                        ...normalizePayloadForKind('safety_education', current),
                        materialSummary: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>교육 아젠다</span>
                  <textarea
                    className="app-textarea"
                    value={fromLineItems(educationPayload.agenda)}
                    onChange={(event) =>
                      updatePayload<Record<string, unknown>>((current) => ({
                        ...normalizePayloadForKind('safety_education', current),
                        agenda: toLineItems(event.target.value),
                      }))
                    }
                  />
                </label>
              </>
            ) : null}

            {workLogPayload ? (
              <>
                <div className={`${styles.fieldGrid} ${styles.fieldGridCols2}`}>
                  <label className={styles.field}>
                    <span className={styles.fieldLabel}>작업 인원</span>
                    <input
                      type="number"
                      className="app-input"
                      value={workLogPayload.workerCount ?? ''}
                      onChange={(event) =>
                        updatePayload<SafetyWorkLogPayload>((current) => ({
                          ...normalizePayloadForKind('safety_work_log', current),
                          workerCount: event.target.value ? Number(event.target.value) : null,
                        }))
                      }
                    />
                  </label>
                </div>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>주요 작업</span>
                  <textarea
                    className="app-textarea"
                    value={fromLineItems(workLogPayload.mainTasks)}
                    onChange={(event) =>
                      updatePayload<SafetyWorkLogPayload>((current) => ({
                        ...normalizePayloadForKind('safety_work_log', current),
                        mainTasks: toLineItems(event.target.value),
                      }))
                    }
                  />
                </label>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>당일 이슈</span>
                  <textarea
                    className="app-textarea"
                    value={fromLineItems(workLogPayload.issues)}
                    onChange={(event) =>
                      updatePayload<SafetyWorkLogPayload>((current) => ({
                        ...normalizePayloadForKind('safety_work_log', current),
                        issues: toLineItems(event.target.value),
                      }))
                    }
                  />
                </label>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>작업 사진</span>
                  <div className={styles.sectionActions}>
                    <button
                      type="button"
                      className="app-button app-button-secondary"
                      onClick={() => photoInputRef.current?.click()}
                    >
                      {isUploadingPhotos ? '사진 업로드 중...' : '사진 업로드'}
                    </button>
                  </div>
                  {workLogPayload.photos.length === 0 ? (
                    <p className={styles.helperText}>업로드된 사진이 없습니다.</p>
                  ) : (
                    <div className={styles.textList}>
                      {workLogPayload.photos.map((photoUrl, index) => (
                        <div key={photoUrl} className={styles.textListItem}>
                          <span className={styles.textListBullet}>•</span>
                          <a href={photoUrl} target="_blank" rel="noreferrer">
                            {getPhotoFileName(photoUrl, index)}
                          </a>
                          <button
                            type="button"
                            className="app-button app-button-secondary"
                            onClick={() => handleRemovePhoto(photoUrl)}
                          >
                            삭제
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </label>
              </>
            ) : null}

            {inspectionPayload ? (
              <>
                <div className={styles.fieldGrid}>
                  <span className={styles.fieldLabel}>점검 항목</span>
                  {inspectionPayload.checklist.map((item, index) => (
                    <div
                      key={`${item.item}-${index}`}
                      className={`${styles.fieldGrid} ${styles.fieldGridCols2}`}
                    >
                      <input
                        className="app-input"
                        value={item.item}
                        placeholder="점검 항목"
                        onChange={(event) =>
                          updatePayload<SafetyInspectionPayload>((current) => {
                            const next = normalizePayloadForKind(inspectionKind, current);
                            next.checklist = next.checklist.map((checklistItem, checklistIndex) =>
                              checklistIndex === index
                                ? { ...checklistItem, item: event.target.value }
                                : checklistItem
                            );
                            return next;
                          })
                        }
                      />
                      <div className={styles.tableActions}>
                        <select
                          className="app-select"
                          value={item.status}
                          onChange={(event) =>
                            updatePayload<SafetyInspectionPayload>((current) => {
                              const next = normalizePayloadForKind(inspectionKind, current);
                              next.checklist = next.checklist.map((checklistItem, checklistIndex) =>
                                checklistIndex === index
                                  ? {
                                      ...checklistItem,
                                      status: event.target.value as SafetyInspectionChecklistItem['status'],
                                    }
                                  : checklistItem
                              );
                              return next;
                            })
                          }
                        >
                          <option value="good">양호</option>
                          <option value="warning">주의</option>
                          <option value="action_required">조치필요</option>
                        </select>
                        <button
                          type="button"
                          className="app-button app-button-secondary"
                          onClick={() =>
                            updatePayload<SafetyInspectionPayload>((current) => {
                              const next = normalizePayloadForKind(inspectionKind, current);
                              next.checklist = next.checklist.filter((_, checklistIndex) => checklistIndex !== index);
                              return next;
                            })
                          }
                        >
                          삭제
                        </button>
                      </div>
                      <input
                        className="app-input"
                        value={item.note}
                        placeholder="메모"
                        onChange={(event) =>
                          updatePayload<SafetyInspectionPayload>((current) => {
                            const next = normalizePayloadForKind(inspectionKind, current);
                            next.checklist = next.checklist.map((checklistItem, checklistIndex) =>
                              checklistIndex === index
                                ? { ...checklistItem, note: event.target.value }
                                : checklistItem
                            );
                            return next;
                          })
                        }
                      />
                    </div>
                  ))}
                  <div className={styles.sectionActions}>
                    <button
                      type="button"
                      className="app-button app-button-secondary"
                      onClick={() =>
                        updatePayload<SafetyInspectionPayload>((current) => {
                          const next = normalizePayloadForKind(inspectionKind, current);
                          next.checklist = [
                            ...next.checklist,
                            { item: '', status: 'warning', note: '' },
                          ];
                          return next;
                        })
                      }
                    >
                      점검 항목 추가
                    </button>
                  </div>
                </div>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>조치 내역</span>
                  <textarea
                    className="app-textarea"
                    value={fromLineItems(inspectionPayload.actions)}
                    onChange={(event) =>
                      updatePayload<SafetyInspectionPayload>((current) => ({
                        ...normalizePayloadForKind(inspectionKind, current),
                        actions: toLineItems(event.target.value),
                      }))
                    }
                  />
                </label>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>점검 사진</span>
                  <div className={styles.sectionActions}>
                    <button
                      type="button"
                      className="app-button app-button-secondary"
                      onClick={() => photoInputRef.current?.click()}
                    >
                      {isUploadingPhotos ? '사진 업로드 중...' : '사진 업로드'}
                    </button>
                  </div>
                  {inspectionPayload.photos.length === 0 ? (
                    <p className={styles.helperText}>업로드된 사진이 없습니다.</p>
                  ) : (
                    <div className={styles.textList}>
                      {inspectionPayload.photos.map((photoUrl, index) => (
                        <div key={photoUrl} className={styles.textListItem}>
                          <span className={styles.textListBullet}>•</span>
                          <a href={photoUrl} target="_blank" rel="noreferrer">
                            {getPhotoFileName(photoUrl, index)}
                          </a>
                          <button
                            type="button"
                            className="app-button app-button-secondary"
                            onClick={() => handleRemovePhoto(photoUrl)}
                          >
                            삭제
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </label>
              </>
            ) : null}
            </fieldset>
          </div>
        </section>

        <div className={styles.secondaryGrid}>
          <section className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionHeaderMain}>
                <h2 className={styles.sectionTitle}>저장 상태 / 필수 입력</h2>
                <p className={styles.sectionDescription}>
                  자동저장 상태와 최종확정 전 필수 입력 조건을 함께 확인합니다.
                </p>
              </div>
            </div>
            <div className={styles.sectionBody}>
              <div className={styles.inlineStats}>
                <span className={styles.badge}>{saveStatusDescription}</span>
                {lastAutosavedAt ? (
                  <span className={styles.badge}>자동저장 {formatErpDateTime(lastAutosavedAt)}</span>
                ) : null}
                {lastManualSavedAt ? (
                  <span className={styles.badge}>수동 저장 {formatErpDateTime(lastManualSavedAt)}</span>
                ) : null}
              </div>
              {validationIssues.length === 0 ? (
                <p className={styles.helperText}>
                  필수 입력 조건을 모두 충족했습니다. 최종확정할 수 있습니다.
                </p>
              ) : (
                <div className={styles.textList}>
                  {validationIssues.map((issue) => (
                    <div key={issue.id} className={styles.textListItem}>
                      <span className={styles.textListBullet}>•</span>
                      <span>{issue.message}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {mobileAckField ? (
            <section className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionHeaderMain}>
                  <h2 className={styles.sectionTitle}>모바일 확인 대상자</h2>
                  <p className={styles.sectionDescription}>
                    최신 {currentDocumentKindLabel} 문서를 기준으로 아직 확인하지 않은 출입자를 바로 확인합니다.
                  </p>
                </div>
                <div className={styles.sectionActions}>
                  <button
                    type="button"
                    className="app-button app-button-primary"
                    onClick={() => void handleReissuePendingLinks()}
                    disabled={pendingMobileAckWorkers.length === 0 || isReissuingPendingLinks}
                  >
                    {isReissuingPendingLinks ? '링크 재발급 중...' : '미확인 링크 재발급'}
                  </button>
                  <button
                    type="button"
                    className="app-button app-button-secondary"
                    onClick={handleDownloadPendingWorkersCsv}
                    disabled={pendingMobileAckWorkers.length === 0}
                  >
                    미확인 CSV
                  </button>
                  {reissuedPendingLinks.length > 0 ? (
                    <button
                      type="button"
                      className="app-button app-button-secondary"
                      onClick={handleDownloadReissuedLinksCsv}
                    >
                      재발급 링크 CSV
                    </button>
                  ) : null}
                  <a
                    href={pendingWorkersHref}
                    className="app-button app-button-secondary"
                  >
                    출입자관리 보기
                  </a>
                </div>
              </div>
              <div className={styles.sectionBody}>
                {!isLatestMobileAcknowledgementDocument ? (
                  <p className={styles.helperText}>
                    최신 {currentDocumentKindLabel} 문서가 아닙니다. 누락 경고는 현재 현장에 배포 중인 최신 문서에서만 계산합니다.
                  </p>
                ) : eligibleMobileAckWorkers.length === 0 ? (
                  <p className={styles.helperText}>
                    아직 확인 대상 출입자가 없습니다. 출입자 등록 상태나 확인 제외 설정을 확인해 주세요.
                  </p>
                ) : (
                  <>
                    <div className={styles.inlineStats}>
                      <span className={styles.badge}>대상 {eligibleMobileAckWorkers.length}명</span>
                      <span className={`${styles.badge} ${styles.badgePublished}`}>
                        완료 {completedMobileAckCount}명
                      </span>
                      <span className={`${styles.badge} ${pendingMobileAckWorkers.length > 0 ? styles.badgeWarning : styles.badgePublished}`}>
                        미확인 {pendingMobileAckWorkers.length}명
                      </span>
                      {excludedMobileAckCount > 0 ? (
                        <span className={styles.badge}>제외 {excludedMobileAckCount}명</span>
                      ) : null}
                    </div>
                    {pendingMobileAckWorkers.length === 0 ? (
                      <p className={styles.helperText}>
                        현재 확인 대상 출입자 기준으로 미확인 인원이 없습니다.
                      </p>
                    ) : (
                      <div className={styles.textList}>
                        {pendingMobileAckWorkers.slice(0, 12).map((worker) => (
                          <div key={worker.id} className={styles.linkHistoryItem}>
                            <div className={styles.linkHistoryMain}>
                              <div className={styles.inlineStats}>
                                <span className={`${styles.badge} ${styles.badgeWarning}`}>미확인</span>
                                {worker.trade ? <span className={styles.badge}>{worker.trade}</span> : null}
                                {worker.company_name ? <span className={styles.badge}>{worker.company_name}</span> : null}
                              </div>
                              <p className={styles.sectionDescription}>
                                {worker.name}
                                {worker.phone ? ` / ${worker.phone}` : ''}
                              </p>
                            </div>
                          </div>
                        ))}
                        {pendingMobileAckWorkers.length > 12 ? (
                          <p className={styles.helperText}>
                            외 {pendingMobileAckWorkers.length - 12}명은 출입자관리에서 전체 목록을 확인해 주세요.
                          </p>
                        ) : null}
                      </div>
                    )}
                    {reissuedPendingLinks.length > 0 ? (
                      <section className={styles.sectionCard}>
                        <div className={styles.sectionHeader}>
                          <div className={styles.sectionHeaderMain}>
                            <h3 className={styles.sectionTitle}>방금 재발급한 링크</h3>
                            <p className={styles.sectionDescription}>
                              미확인 인원에게 다시 배포할 모바일 링크를 바로 복사하거나 CSV로 내보낼 수 있습니다.
                            </p>
                          </div>
                        </div>
                        <div className={styles.sectionBody}>
                          <div className={styles.inlineStats}>
                            <span className={styles.badge}>재발급 {reissuedPendingLinks.length}명</span>
                          </div>
                          <div className={styles.textList}>
                            {reissuedPendingLinks.map((item) => (
                              <div key={item.session.id} className={styles.linkHistoryItem}>
                                <div className={styles.linkHistoryMain}>
                                  <div className={styles.inlineStats}>
                                    <span className={styles.badge}>{item.worker.name}</span>
                                    {item.worker.company_name ? (
                                      <span className={styles.badge}>{item.worker.company_name}</span>
                                    ) : null}
                                    {item.worker.trade ? (
                                      <span className={styles.badge}>{item.worker.trade}</span>
                                    ) : null}
                                    <span className={styles.badge}>
                                      만료 {formatErpDateTime(item.session.expires_at)}
                                    </span>
                                  </div>
                                  <p className={styles.linkHistoryUrl}>
                                    {buildAbsoluteEntryUrl(item.session.entry_url)}
                                  </p>
                                </div>
                                <div className={styles.sectionActions}>
                                  <button
                                    type="button"
                                    className="app-button app-button-secondary"
                                    onClick={() =>
                                      void handleCopyReissuedEntryUrl(item.session.entry_url)
                                    }
                                  >
                                    링크 복사
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </section>
                    ) : null}
                  </>
                )}
              </div>
            </section>
          ) : null}

          <section className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionHeaderMain}>
                <h2 className={styles.sectionTitle}>초안 컨텍스트</h2>
                <p className={styles.sectionDescription}>
                  기존 ERP에 저장된 최근 문서, 미조치 항목, 작업자 구성을 초안 작성에 바로 반영할 수 있습니다.
                </p>
              </div>
              <div className={styles.sectionActions}>
                <button
                  type="button"
                  className="app-button app-button-secondary"
                  onClick={handleApplyRecentData}
                  disabled={!draftContext?.previous_document || isSaving || isReadOnly}
                >
                  최근 문서 반영
                </button>
                <button
                  type="button"
                  className="app-button app-button-secondary"
                  onClick={handleApplyUnresolvedItems}
                  disabled={!draftContext?.unresolved_items.length || isSaving || isReadOnly}
                >
                  미조치 반영
                </button>
              </div>
            </div>
            <div className={styles.sectionBody}>
              {!draftContext ? (
                <div className={styles.emptyState}>
                  <p className={styles.emptyDescription}>
                    이 문서에 연결할 ERP 초안 컨텍스트를 아직 불러오지 못했습니다.
                  </p>
                </div>
              ) : (
                <>
                  <div className={styles.inlineStats}>
                    <span className={styles.badge}>
                      등록 {draftContext.worker_summary.registered_count}명
                    </span>
                    <span className={styles.badge}>
                      작업 가능 {draftContext.worker_summary.active_count}명
                    </span>
                    {draftContext.worker_summary.trade_names.slice(0, 2).map((trade) => (
                      <span key={trade} className={styles.badge}>
                        {trade}
                      </span>
                    ))}
                  </div>

                  {draftContext.previous_document ? (
                    <div className={styles.fieldGrid}>
                      <span className={styles.fieldLabel}>직전 유사 문서</span>
                      <div className={styles.textList}>
                        <div className={styles.textListItem}>
                          <span className={styles.textListBullet}>•</span>
                          <span>
                            {draftContext.previous_document.report.report_title}
                            {' / '}
                            {formatErpDateTime(draftContext.previous_document.report.updated_at)}
                          </span>
                        </div>
                        {draftContext.previous_document.summary_items.map((item) => (
                          <div key={item} className={styles.textListItem}>
                            <span className={styles.textListBullet}>•</span>
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div className={styles.fieldGrid}>
                    <span className={styles.fieldLabel}>최근 미조치 항목</span>
                    {draftContext.unresolved_items.length === 0 ? (
                      <p className={styles.helperText}>최근 점검/작업일지에서 이어받을 미조치 항목이 없습니다.</p>
                    ) : (
                      <div className={styles.textList}>
                        {draftContext.unresolved_items.map((item) => (
                          <div key={item} className={styles.textListItem}>
                            <span className={styles.textListBullet}>•</span>
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {draftContext.recent_documents.length > 0 ? (
                    <div className={styles.fieldGrid}>
                      <span className={styles.fieldLabel}>최근 문서 흐름</span>
                      <div className={styles.textList}>
                        {draftContext.recent_documents.slice(0, 4).map((item) => (
                          <div
                            key={item.report.id}
                            className={styles.textListItem}
                          >
                            <span className={styles.textListBullet}>•</span>
                            <span>
                              {item.report.report_title}
                              {' / '}
                              {item.report.document_kind
                                ? ERP_DOCUMENT_KIND_LABELS[item.report.document_kind]
                                : '일반 보고서'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </>
              )}
            </div>
          </section>

          <section className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionHeaderMain}>
                <h2 className={styles.sectionTitle}>템플릿 힌트</h2>
                <p className={styles.sectionDescription}>관리자 템플릿에서 가져온 참고 문구입니다.</p>
              </div>
            </div>
            <div className={styles.sectionBody}>
              {contextualTemplatePreview.length === 0 ? (
                <div className={styles.emptyState}>
                  <p className={styles.emptyDescription}>등록된 템플릿이 없습니다.</p>
                </div>
              ) : (
                <div className={styles.textList}>
                  {contextualTemplatePreview.map((item) => (
                    <div key={item} className={styles.textListItem}>
                      <span className={styles.textListBullet}>•</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {signaturePayload && (
            <section className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionHeaderMain}>
                  <h2 className={styles.sectionTitle}>참석 서명</h2>
                  <p className={styles.sectionDescription}>관리직 수기 등록 또는 모바일 서명 결과를 확인합니다.</p>
                </div>
              </div>
              <div className={styles.sectionBody}>
                <fieldset
                  disabled={isReadOnly || isUploadingPhotos}
                  style={{ border: 0, margin: 0, minWidth: 0, padding: 0, display: 'grid', gap: 16 }}
                >
                {signaturePayload.signatures.map((signature, index) => (
                  <div
                    key={`${signature.name}-${index}`}
                    className={`${styles.fieldGrid} ${styles.fieldGridCols2}`}
                  >
                    <input
                      className="app-input"
                      value={signature.name}
                      placeholder="이름"
                      onChange={(event) =>
                        updatePayload<TbmDocumentPayload | SafetyEducationPayload>((current) => {
                          const next = normalizePayloadForKind(signatureKind, current);
                          const signatures = next.signatures.map((item, itemIndex) =>
                            itemIndex === index ? { ...item, name: event.target.value } : item
                          );
                          next.signatures = signatures;
                          return next;
                        })
                      }
                    />
                    <input
                      className="app-input"
                      value={signature.company_name ?? ''}
                      placeholder="업체명"
                      onChange={(event) =>
                        updatePayload<TbmDocumentPayload | SafetyEducationPayload>((current) => {
                          const next = normalizePayloadForKind(signatureKind, current);
                          const signatures = next.signatures.map((item, itemIndex) =>
                            itemIndex === index
                              ? { ...item, company_name: event.target.value || null }
                              : item
                          );
                          next.signatures = signatures;
                          return next;
                        })
                      }
                    />
                  </div>
                ))}
                <div className={styles.sectionActions}>
                  <button
                    type="button"
                    className="app-button app-button-secondary"
                    onClick={() =>
                      updatePayload<TbmDocumentPayload | SafetyEducationPayload>((current) => {
                        const next = normalizePayloadForKind(signatureKind, current);
                        next.signatures = [
                          ...next.signatures,
                          { name: '', company_name: null, signed_at: null, signature_data: null },
                        ];
                        return next;
                      })
                    }
                  >
                    수기 서명 행 추가
                  </button>
                </div>
                </fieldset>
              </div>
            </section>
          )}

          <section className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionHeaderMain}>
                <h2 className={styles.sectionTitle}>모바일 확인 기록</h2>
                <p className={styles.sectionDescription}>일용직 모바일 링크에서 제출된 서명과 확인 결과입니다.</p>
              </div>
              <div className={styles.sectionActions}>
                <button
                  type="button"
                  className="app-button app-button-secondary"
                  onClick={handleDownloadAcknowledgementsCsv}
                  disabled={mobileAcknowledgements.length === 0}
                >
                  확인 기록 CSV
                </button>
              </div>
            </div>
            <div className={styles.sectionBody}>
              {mobileAcknowledgements.length === 0 ? (
                <div className={styles.emptyState}>
                  <p className={styles.emptyDescription}>아직 제출된 모바일 확인 기록이 없습니다.</p>
                </div>
              ) : (
                <>
                  <div className={styles.inlineStats}>
                    <span className={styles.badge}>총 {mobileAcknowledgements.length}건</span>
                    {Object.entries(mobileAcknowledgementCounts).map(([kind, count]) =>
                      kind !== 'unknown' ? (
                        <span key={kind} className={styles.badge}>
                          {ERP_DOCUMENT_KIND_LABELS[kind as ErpDocumentKind]} {count}건
                        </span>
                      ) : null
                    )}
                  </div>
                  <div className={styles.textList}>
                    {mobileAcknowledgements.map((item, index) => (
                      <div
                        key={`${item.worker_id ?? item.worker_name ?? 'worker'}-${index}`}
                        className={styles.linkHistoryItem}
                      >
                        <div className={styles.linkHistoryMain}>
                          <div className={styles.inlineStats}>
                            {item.kind ? (
                              <span className={styles.badge}>
                                {ERP_DOCUMENT_KIND_LABELS[item.kind]}
                              </span>
                            ) : null}
                            <span className={`${styles.badge} ${styles.badgePublished}`}>모바일 확인</span>
                            <span className={styles.badge}>
                              {formatErpDateTime(item.acknowledged_at)}
                            </span>
                          </div>
                          <p className={styles.sectionDescription}>
                            {item.worker_name || '근로자'}
                            {' / '}
                            {item.signature_name || '서명자 미입력'}
                          </p>
                          {item.note ? (
                            <p className={styles.helperText}>메모: {item.note}</p>
                          ) : null}
                        </div>
                        {item.signature_data ? (
                          <div className={styles.sectionActions}>
                            <a
                              href={item.signature_data}
                              target="_blank"
                              rel="noreferrer"
                              className="app-button app-button-secondary"
                            >
                              서명 보기
                            </a>
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </section>
        </div>
      </div>
    </ErpSiteShell>
  );
}

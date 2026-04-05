import type {
  ErpDocumentKind,
  SafetyContentType,
  SafetyContentItem,
  SafetyPendingMobileAckGroup,
  SafetyLoginInput,
  SafetyQuarterlySummarySeed,
  SafetyReport,
  SafetyReportDraftContext,
  SafetyReportListItem,
  SafetyReportStatusUpdateInput,
  SafetySite,
  SafetyTechnicalGuidanceSeed,
  SafetySiteDashboard,
  SiteWorker,
  SiteWorkerImportResponse,
  SiteWorkerUpsertInput,
  SafetyTokenResponse,
  SafetyUpsertReportInput,
  SafetyUser,
  WorkerAckDocumentKind,
  WorkerMobileSession,
  WorkerMobileSessionDetail,
  WorkerMobileTaskAcknowledgeInput,
} from '@/types/backend';
import { requestSafetyApi, SafetyApiError } from './client';

const CLIENT_SITE_LIST_LIMIT = 500;
const CLIENT_CONTENT_ITEM_LIMIT = 1000;
const ERP_UNSUPPORTED_STATUSES = new Set([405, 501]);
const ERP_TEMPLATE_CONTENT_TYPES: Record<ErpDocumentKind, SafetyContentType[]> = {
  tbm: ['tbm_template'],
  hazard_notice: ['notice_template'],
  safety_education: ['education_template'],
  safety_work_log: ['notice_template'],
  safety_inspection_log: ['notice_template'],
  patrol_inspection_log: ['notice_template'],
};
const ERP_ACK_LABELS: Record<WorkerAckDocumentKind, string> = {
  hazard_notice: '오늘 공지',
  tbm: 'TBM',
  safety_education: '안전 교육',
};

function isUnsupportedErpError(error: unknown): error is SafetyApiError {
  return error instanceof SafetyApiError && ERP_UNSUPPORTED_STATUSES.has(error.status ?? -1);
}

function buildUnsupportedFeatureError(feature: string): SafetyApiError {
  return new SafetyApiError(
    `${feature} 기능은 현재 연결된 safety-server 버전에서 지원되지 않습니다.`,
    501
  );
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function parseErpDocumentKind(value: unknown): ErpDocumentKind | null {
  return value === 'tbm' ||
    value === 'hazard_notice' ||
    value === 'safety_education' ||
    value === 'safety_work_log' ||
    value === 'safety_inspection_log' ||
    value === 'patrol_inspection_log'
    ? value
    : null;
}

function getReportDocumentKind(report: Pick<SafetyReport, 'document_kind' | 'meta'>): ErpDocumentKind | null {
  return parseErpDocumentKind(report.document_kind ?? asRecord(report.meta).documentKind);
}

function compareByUpdatedAtDesc(left: Pick<SafetyReport, 'updated_at'>, right: Pick<SafetyReport, 'updated_at'>) {
  return String(right.updated_at ?? '').localeCompare(String(left.updated_at ?? ''));
}

function toReportListItem(report: SafetyReport): SafetyReportListItem {
  return {
    id: report.id,
    report_key: report.report_key,
    report_title: report.report_title,
    site_id: report.site_id,
    headquarter_id: report.headquarter_id,
    assigned_user_id: report.assigned_user_id,
    visit_date: report.visit_date,
    visit_round: report.visit_round,
    total_round: report.total_round,
    progress_rate: report.progress_rate,
    status: report.status,
    payload_version: report.payload_version,
    latest_revision_no: report.latest_revision_no,
    submitted_at: report.submitted_at,
    published_at: report.published_at,
    last_autosaved_at: report.last_autosaved_at,
    document_kind: getReportDocumentKind(report),
    meta: report.meta,
    created_at: report.created_at,
    updated_at: report.updated_at,
  };
}

function createFallbackSite(siteId: string): SafetySite {
  return {
    id: siteId,
    headquarter_id: '',
    headquarter: null,
    headquarter_detail: null,
    assigned_user: null,
    assigned_users: [],
    active_assignment_count: 0,
    site_name: siteId,
    site_code: null,
    management_number: null,
    project_start_date: null,
    project_end_date: null,
    project_amount: null,
    manager_name: null,
    manager_phone: null,
    site_address: null,
    status: 'recovery',
    memo: 'ERP 체크포인트 복구 상태',
    created_at: new Date(0).toISOString(),
    updated_at: new Date(0).toISOString(),
  };
}

function buildPendingMobileAckGroup(kind: WorkerAckDocumentKind): SafetyPendingMobileAckGroup {
  return {
    kind,
    label: ERP_ACK_LABELS[kind],
    count: 0,
    excluded_count: 0,
    report_id: null,
    report_title: null,
    report_updated_at: null,
    workers: [],
  };
}

function extractTemplateItems(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item) => extractTemplateItems(item)).filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (value && typeof value === 'object') {
    return Object.values(value).flatMap((item) => extractTemplateItems(item)).filter(Boolean);
  }

  return [];
}

function buildUnresolvedItems(reports: SafetyReport[]): string[] {
  const items = reports.flatMap((report) => {
    const kind = getReportDocumentKind(report);
    const payload = asRecord(report.payload);
    if (kind === 'safety_work_log') {
      const issues = Array.isArray(payload.issues) ? payload.issues : [];
      return issues
        .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
        .map((item) => `${report.report_title}: ${item}`);
    }
    if (kind === 'safety_inspection_log' || kind === 'patrol_inspection_log') {
      const checklist = Array.isArray(payload.checklist) ? payload.checklist : [];
      const actions = Array.isArray(payload.actions) ? payload.actions : [];
      const checklistItems = checklist.flatMap((item) => {
        const record = asRecord(item);
        const status = asString(record.status);
        const label = asString(record.item).trim();
        if (!label || status === 'good') return [];
        return [`${report.report_title}: ${label}`];
      });
      const actionItems = actions.flatMap((item) =>
        typeof item === 'string' && item.trim()
          ? [`${report.report_title} 조치: ${item.trim()}`]
          : []
      );
      return [...checklistItems, ...actionItems];
    }
    return [];
  });

  return Array.from(new Set(items));
}

function buildUnresolvedPayload(kind: ErpDocumentKind, unresolvedItems: string[]): Record<string, unknown> {
  if (kind === 'safety_work_log') {
    return {
      workerCount: null,
      mainTasks: [],
      issues: unresolvedItems,
      photos: [],
    };
  }

  if (kind === 'safety_inspection_log' || kind === 'patrol_inspection_log') {
    return {
      checklist: unresolvedItems.map((item) => ({
        item,
        status: 'action_required',
        note: '',
      })),
      actions: unresolvedItems,
      photos: [],
    };
  }

  return {};
}

async function buildFallbackSiteDashboard(token: string, siteId: string): Promise<SafetySiteDashboard> {
  const [sites, reports] = await Promise.all([
    fetchAssignedSafetySites(token).catch(() => [] as SafetySite[]),
    fetchSafetyReportsBySite(token, siteId).catch(() => [] as SafetyReport[]),
  ]);
  const site = sites.find((item) => item.id === siteId) ?? createFallbackSite(siteId);
  const latestDocuments = reports
    .map((report) => ({ ...report, document_kind: getReportDocumentKind(report) }))
    .filter((report) => Boolean(report.document_kind))
    .sort(compareByUpdatedAtDesc)
    .slice(0, 6)
    .map((report) => ({
      report_id: report.id,
      report_key: report.report_key,
      report_title: report.report_title,
      document_kind: report.document_kind ?? null,
      status: report.status,
      visit_date: report.visit_date,
      updated_at: report.updated_at,
    }));
  const inspectionKinds = new Set<ErpDocumentKind>(['safety_inspection_log', 'patrol_inspection_log']);

  return {
    site,
    registered_worker_count: 0,
    blocked_worker_count: 0,
    unacknowledged_notice_count: 0,
    unsigned_tbm_count: 0,
    incomplete_education_count: 0,
    incomplete_inspection_document_count: latestDocuments.filter(
      (item) => item.document_kind && inspectionKinds.has(item.document_kind)
    ).length,
    latest_documents: latestDocuments,
    pending_mobile_ack_groups: [
      buildPendingMobileAckGroup('hazard_notice'),
      buildPendingMobileAckGroup('tbm'),
      buildPendingMobileAckGroup('safety_education'),
    ],
  };
}

async function buildFallbackDraftContext(
  token: string,
  siteId: string,
  documentKind: ErpDocumentKind,
  excludeReportId?: string | null
): Promise<SafetyReportDraftContext> {
  const [reports, contentItems] = await Promise.all([
    fetchSafetyReportsBySite(token, siteId).catch(() => [] as SafetyReport[]),
    fetchSafetyContentItems(token).catch(() => [] as SafetyContentItem[]),
  ]);
  const filteredReports = reports
    .filter((report) => report.id !== excludeReportId)
    .sort(compareByUpdatedAtDesc);
  const previousDocument =
    filteredReports.find((report) => getReportDocumentKind(report) === documentKind) ?? null;
  const unresolvedItems = buildUnresolvedItems(filteredReports);
  const templateItems = contentItems
    .filter((item) => ERP_TEMPLATE_CONTENT_TYPES[documentKind].includes(item.content_type))
    .flatMap((item) => extractTemplateItems(item.body))
    .slice(0, 12);

  return {
    site_id: siteId,
    document_kind: documentKind,
    previous_document: previousDocument
      ? {
          report: toReportListItem(previousDocument),
          summary_items: [],
        }
      : null,
    recent_documents: filteredReports
      .filter((report) => Boolean(getReportDocumentKind(report)))
      .slice(0, 6)
      .map((report) => ({
        report: toReportListItem(report),
        summary_items: [],
      })),
    recent_payload: previousDocument?.payload ?? {},
    unresolved_items: unresolvedItems,
    unresolved_payload: buildUnresolvedPayload(documentKind, unresolvedItems),
    template_items: templateItems,
    worker_summary: {
      registered_count: 0,
      active_count: 0,
      trade_names: [],
      company_names: [],
      worker_names: [],
      employment_breakdown: {},
    },
  };
}

export async function loginSafetyApi(
  input: SafetyLoginInput
): Promise<SafetyTokenResponse> {
  const body = new URLSearchParams();
  body.set('username', input.email.trim());
  body.set('password', input.password);

  return requestSafetyApi<SafetyTokenResponse>('/auth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });
}

export function fetchCurrentSafetyUser(token: string): Promise<SafetyUser> {
  return requestSafetyApi<SafetyUser>('/auth/me', {}, token);
}

export function fetchAssignedSafetySites(token: string): Promise<SafetySite[]> {
  const searchParams = new URLSearchParams({
    active_only: 'true',
    include_headquarter_detail: 'true',
    include_assigned_user: 'true',
    limit: String(CLIENT_SITE_LIST_LIMIT),
  });

  return requestSafetyApi<SafetySite[]>(
    `/assignments/me/sites?${searchParams.toString()}`,
    {},
    token
  );
}

/** 관리자 CRUD와 동일하게 전체·충분한 limit으로 조회. API 기본값(active_only·limit)에 의해 일부 유형만 잘리는 것을 방지. */
export function fetchSafetyContentItems(token: string): Promise<SafetyContentItem[]> {
  const searchParams = new URLSearchParams({
    active_only: 'true',
    limit: String(CLIENT_CONTENT_ITEM_LIMIT),
  });

  return requestSafetyApi<SafetyContentItem[]>(
    `/content-items?${searchParams.toString()}`,
    {},
    token
  );
}

export function fetchSafetyReportsBySite(
  token: string,
  siteId: string,
  options?: {
    reportKinds?: string[];
  },
): Promise<SafetyReport[]> {
  const searchParams = new URLSearchParams({
    active_only: 'true',
  });
  options?.reportKinds?.forEach((reportKind) => {
    if (reportKind.trim()) {
      searchParams.append('report_kind', reportKind);
    }
  });

  return requestSafetyApi<SafetyReport[]>(
    `/reports/site/${siteId}/full?${searchParams.toString()}`,
    {},
    token
  );
}

export function fetchSafetyReportList(
  token: string,
  options?: {
    siteId?: string;
    activeOnly?: boolean;
    limit?: number;
    reportKinds?: string[];
  }
): Promise<SafetyReportListItem[]> {
  const searchParams = new URLSearchParams({
    active_only: String(options?.activeOnly ?? true),
    limit: String(options?.limit ?? 100),
  });

  if (options?.siteId) {
    searchParams.set('site_id', options.siteId);
  }
  options?.reportKinds?.forEach((reportKind) => {
    if (reportKind.trim()) {
      searchParams.append('report_kind', reportKind);
    }
  });

  return requestSafetyApi<SafetyReportListItem[]>(
    `/reports?${searchParams.toString()}`,
    {},
    token
  );
}

export function fetchSafetyReportByKey(
  token: string,
  reportKey: string
): Promise<SafetyReport> {
  return requestSafetyApi<SafetyReport>(
    `/reports/by-key/${reportKey}`,
    {},
    token
  );
}

export function fetchTechnicalGuidanceSeed(
  token: string,
  siteId: string,
): Promise<SafetyTechnicalGuidanceSeed> {
  return requestSafetyApi<SafetyTechnicalGuidanceSeed>(
    `/reports/site/${siteId}/technical-guidance-seed`,
    {},
    token,
  );
}

export function fetchQuarterlySummarySeed(
  token: string,
  siteId: string,
  options: {
    periodStartDate: string;
    periodEndDate: string;
    selectedReportKeys?: string[];
    explicitSelection?: boolean;
  },
): Promise<SafetyQuarterlySummarySeed> {
  const searchParams = new URLSearchParams({
    period_start_date: options.periodStartDate,
    period_end_date: options.periodEndDate,
    explicit_selection: String(options.explicitSelection ?? false),
  });
  options.selectedReportKeys?.forEach((reportKey) => {
    if (reportKey.trim()) {
      searchParams.append('selected_report_keys', reportKey);
    }
  });

  return requestSafetyApi<SafetyQuarterlySummarySeed>(
    `/reports/site/${siteId}/quarterly-summary-seed?${searchParams.toString()}`,
    {},
    token,
  );
}

export function fetchSafetyReportById(
  token: string,
  reportId: string
): Promise<SafetyReport> {
  return requestSafetyApi<SafetyReport>(`/reports/${reportId}`, {}, token);
}

export function upsertSafetyReport(
  token: string,
  payload: SafetyUpsertReportInput
): Promise<SafetyReport> {
  return requestSafetyApi<SafetyReport>(
    '/reports/upsert',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    token
  );
}

export function updateSafetyReportStatus(
  token: string,
  reportId: string,
  payload: SafetyReportStatusUpdateInput
): Promise<SafetyReport> {
  return requestSafetyApi<SafetyReport>(
    `/reports/${reportId}/status`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    token
  );
}

export async function fetchSafetySiteDashboard(
  token: string,
  siteId: string
): Promise<SafetySiteDashboard> {
  try {
    return await requestSafetyApi<SafetySiteDashboard>(`/sites/${siteId}/dashboard`, {}, token);
  } catch (error) {
    if (isUnsupportedErpError(error)) {
      return buildFallbackSiteDashboard(token, siteId);
    }
    throw error;
  }
}

export async function fetchSafetyReportDraftContext(
  token: string,
  siteId: string,
  documentKind: ErpDocumentKind,
  excludeReportId?: string | null
): Promise<SafetyReportDraftContext> {
  const searchParams = new URLSearchParams({
    document_kind: documentKind,
  });
  if (excludeReportId) {
    searchParams.set('exclude_report_id', excludeReportId);
  }

  try {
    return await requestSafetyApi<SafetyReportDraftContext>(
      `/reports/site/${siteId}/draft-context?${searchParams.toString()}`,
      {},
      token
    );
  } catch (error) {
    if (isUnsupportedErpError(error)) {
      return buildFallbackDraftContext(token, siteId, documentKind, excludeReportId);
    }
    throw error;
  }
}

export async function fetchSiteWorkers(
  token: string,
  options?: {
    siteId?: string;
    blockedOnly?: boolean;
    limit?: number;
  }
): Promise<SiteWorker[]> {
  const searchParams = new URLSearchParams({
    limit: String(options?.limit ?? 100),
  });
  if (options?.siteId) {
    searchParams.set('site_id', options.siteId);
  }
  if (options?.blockedOnly) {
    searchParams.set('blocked_only', 'true');
  }

  try {
    return await requestSafetyApi<SiteWorker[]>(
      `/site-workers?${searchParams.toString()}`,
      {},
      token
    );
  } catch (error) {
    if (isUnsupportedErpError(error)) {
      return [];
    }
    throw error;
  }
}

export async function fetchSiteWorkerMobileSessions(
  token: string,
  workerId: string,
  limit = 30
): Promise<WorkerMobileSession[]> {
  try {
    return await requestSafetyApi<WorkerMobileSession[]>(
      `/site-workers/${workerId}/mobile-sessions?limit=${limit}`,
      {},
      token
    );
  } catch (error) {
    if (isUnsupportedErpError(error)) {
      return [];
    }
    throw error;
  }
}

export function createSiteWorker(
  token: string,
  payload: SiteWorkerUpsertInput & { site_id: string }
): Promise<SiteWorker> {
  return requestSafetyApi<SiteWorker>(
    '/site-workers',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    token
  ).catch((error) => {
    if (isUnsupportedErpError(error)) {
      throw buildUnsupportedFeatureError('출입자 등록');
    }
    throw error;
  });
}

export function updateSiteWorker(
  token: string,
  workerId: string,
  payload: SiteWorkerUpsertInput
): Promise<SiteWorker> {
  return requestSafetyApi<SiteWorker>(
    `/site-workers/${workerId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
    token
  ).catch((error) => {
    if (isUnsupportedErpError(error)) {
      throw buildUnsupportedFeatureError('출입자 수정');
    }
    throw error;
  });
}

export function blockSiteWorker(
  token: string,
  workerId: string,
  isBlocked: boolean
): Promise<SiteWorker> {
  return requestSafetyApi<SiteWorker>(
    `/site-workers/${workerId}/block`,
    {
      method: 'POST',
      body: JSON.stringify({ is_blocked: isBlocked }),
    },
    token
  ).catch((error) => {
    if (isUnsupportedErpError(error)) {
      throw buildUnsupportedFeatureError('출입자 차단');
    }
    throw error;
  });
}

export function createSiteWorkerMobileSession(
  token: string,
  workerId: string
): Promise<WorkerMobileSession> {
  return requestSafetyApi<WorkerMobileSession>(
    `/site-workers/${workerId}/mobile-session`,
    {
      method: 'POST',
      body: JSON.stringify({}),
    },
    token
  ).catch((error) => {
    if (isUnsupportedErpError(error)) {
      throw buildUnsupportedFeatureError('모바일 링크 발급');
    }
    throw error;
  });
}

export function revokeSiteWorkerMobileSession(
  token: string,
  sessionId: string
): Promise<WorkerMobileSession> {
  return requestSafetyApi<WorkerMobileSession>(
    `/worker-mobile-sessions/${sessionId}/revoke`,
    {
      method: 'POST',
      body: JSON.stringify({}),
    },
    token
  ).catch((error) => {
    if (isUnsupportedErpError(error)) {
      throw buildUnsupportedFeatureError('모바일 링크 강제 만료');
    }
    throw error;
  });
}

export function importSiteWorkers(
  token: string,
  siteId: string,
  file: File
): Promise<SiteWorkerImportResponse> {
  const formData = new FormData();
  formData.set('site_id', siteId);
  formData.set('file', file);

  return requestSafetyApi<SiteWorkerImportResponse>(
    '/site-workers/import',
    {
      method: 'POST',
      body: formData,
    },
    token
  ).catch((error) => {
    if (isUnsupportedErpError(error)) {
      throw buildUnsupportedFeatureError('출입자 CSV 등록');
    }
    throw error;
  });
}

export function fetchWorkerMobileSession(token: string): Promise<WorkerMobileSessionDetail> {
  return requestSafetyApi<WorkerMobileSessionDetail>(`/mobile/session/${token}`).catch((error) => {
    if (isUnsupportedErpError(error)) {
      throw buildUnsupportedFeatureError('모바일 링크 조회');
    }
    throw error;
  });
}

export function acknowledgeWorkerMobileTask(
  token: string,
  payload: WorkerMobileTaskAcknowledgeInput
): Promise<{ ok: true }> {
  return requestSafetyApi<{ ok: true }>(
    `/mobile/session/${token}/acknowledge`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  ).catch((error) => {
    if (isUnsupportedErpError(error)) {
      throw buildUnsupportedFeatureError('모바일 확인 제출');
    }
    throw error;
  });
}

export function archiveSafetyReportByKey(
  token: string,
  reportKey: string
): Promise<SafetyReport> {
  return requestSafetyApi<SafetyReport>(
    `/reports/by-key/${reportKey}`,
    {
      method: 'DELETE',
    },
    token
  );
}

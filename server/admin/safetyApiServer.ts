import { getSafetyApiUpstreamBaseUrl } from '@/lib/safetyApi/upstream';
import { buildVisibleAdminSiteIdSet } from '@/lib/admin/reportVisibility';
import {
  applyHeadquarterLifecycleStatus,
  applyReportLifecycleStatus,
  applySiteLifecycleStatus,
  isVisibleHeadquarter,
  isVisibleReport,
  isVisibleSite,
  normalizeReportLifecycleStatus,
} from '@/lib/admin/lifecycleStatus';
import type { SafetyContentAssetUpload } from '@/lib/safetyApi/adminEndpoints';
import type {
  SafetyBackendAdminAlert,
  SafetyBackendAdminAnalyticsResponse,
  SafetyBackendAdminOverviewResponse,
  SafetyBackendAdminReportsResponse,
  SafetyBackendInspectionSchedule,
  SafetyBackendMailAccount,
  SafetyBackendMailProviderStatusResponse,
  SafetyBackendMailMessage,
  SafetyBackendMailThread,
  SafetyBackendMailThreadDetail,
  SafetyBackendNotificationFeedResponse,
  SafetyBackendExcelApplyResult,
  SafetyBackendExcelImportPreview,
  SafetyBackendPhotoAsset,
  SafetyBackendPhotoAssetListResponse,
  SafetyBackendScheduleListResponse,
  SafetyBackendSmsProviderStatusResponse,
  SafetyBackendSmsSendResponse,
  SafetyContentItem,
  SafetyReport,
  SafetyReportListItem,
  SafetySite,
  SafetyUser,
} from '@/types/backend';
import type {
  ControllerDashboardData,
  SafetyAssignment,
  SafetyHeadquarter,
  SafetyHeadquarterInput,
  SafetyHeadquarterUpdateInput,
  SafetySiteInput,
  SafetySiteUpdateInput,
} from '@/types/controller';

const ADMIN_LIST_LIMIT = 500;
const CONTENT_LIST_LIMIT = 1000;
const REPORT_LIST_LIMIT = 500;
const DEFAULT_SERVER_TIMEOUT_MS = 15000;
const LONG_RUNNING_SERVER_TIMEOUT_MS = 45000;

export class SafetyServerApiError extends Error {
  status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.name = 'SafetyServerApiError';
    this.status = status;
  }
}

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeHeadquarterList(headquarters: SafetyHeadquarter[]) {
  return headquarters
    .map((headquarter) => applyHeadquarterLifecycleStatus(headquarter))
    .filter((headquarter) => isVisibleHeadquarter(headquarter));
}

function normalizeSiteList(
  sites: SafetySite[],
  headquarters: SafetyHeadquarter[] = [],
) {
  const normalizedSites = sites
    .map((site) => applySiteLifecycleStatus(site))
    .filter((site) => isVisibleSite(site));
  if (headquarters.length === 0) {
    return normalizedSites;
  }

  const visibleSiteIds = buildVisibleAdminSiteIdSet(normalizedSites, headquarters);
  return normalizedSites.filter((site) => visibleSiteIds.has(normalizeText(site.id)));
}

function normalizeReportList<T extends SafetyReportListItem | SafetyReport>(reports: T[]) {
  return reports
    .map((report) => applyReportLifecycleStatus(report))
    .filter((report) => isVisibleReport(report));
}

function withQuery(
  path: string,
  params: Record<string, string | number | boolean | Array<string | number | boolean> | null | undefined>,
) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === null || value === undefined || value === '') return;
    if (Array.isArray(value)) {
      value.forEach((entry) => {
        if (entry === null || entry === undefined || entry === '') return;
        searchParams.append(key, String(entry));
      });
      return;
    }
    searchParams.set(key, String(value));
  });

  const query = searchParams.toString();
  return query ? `${path}?${query}` : path;
}

function buildUpstreamUrl(path: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${getSafetyApiUpstreamBaseUrl()}${normalizedPath}`;
}

export function buildSafetyAdminUpstreamUrl(path: string) {
  return buildUpstreamUrl(path);
}

async function parseErrorMessage(response: Response) {
  const contentType = response.headers.get('content-type') || '';
  const text = await response.text();

  if (contentType.includes('application/json') && text) {
    try {
      const payload = JSON.parse(text) as Record<string, unknown>;
      if (typeof payload.detail === 'string' && payload.detail.trim()) {
        return payload.detail;
      }
      if (Array.isArray(payload.detail) && payload.detail.length > 0) {
        return JSON.stringify(payload.detail);
      }
      if (typeof payload.error === 'string' && payload.error.trim()) {
        return payload.error;
      }
    } catch {
      return text || response.statusText || '요청 처리 중 오류가 발생했습니다.';
    }
  }

  return text || response.statusText || '요청 처리 중 오류가 발생했습니다.';
}

function buildHeaders(
  _request: Request | null,
  token: string,
  headers?: HeadersInit,
) {
  const nextHeaders = new Headers(headers);
  nextHeaders.set('Authorization', `Bearer ${token}`);
  return nextHeaders;
}

export function readRequiredSafetyAuthToken(request: Request) {
  const authorization = request.headers.get('authorization') || '';
  const matched = authorization.match(/^Bearer\s+(.+)$/i);
  const token = matched?.[1]?.trim() || '';

  if (!token) {
    throw new SafetyServerApiError('로그인이 만료되었습니다. 다시 로그인해 주세요.', 401);
  }

  return token;
}

export const readRequiredAdminToken = readRequiredSafetyAuthToken;

function isAbortError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  return (
    (error instanceof DOMException && error.name === 'AbortError') ||
    ('name' in error && error.name === 'AbortError')
  );
}

function getServerRequestTimeoutMs(path: string, options: RequestInit) {
  if (options.body instanceof FormData) {
    return LONG_RUNNING_SERVER_TIMEOUT_MS;
  }

  if (
    path.includes('/dashboard/') ||
    path.includes('/reports/upsert') ||
    path.includes('/content-items/assets/upload') ||
    path.includes('/photo-assets/upload') ||
    path.includes('/excel-imports/')
  ) {
    return LONG_RUNNING_SERVER_TIMEOUT_MS;
  }

  return DEFAULT_SERVER_TIMEOUT_MS;
}

async function performSafetyServerRequest(
  path: string,
  options: RequestInit,
  token: string,
  request: Request | null,
): Promise<Response> {
  const timeoutMs = getServerRequestTimeoutMs(path, options);
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => {
    abortController.abort(
      new Error(`안전 API 요청이 ${timeoutMs}ms 안에 완료되지 않았습니다.`)
    );
  }, timeoutMs);
  const originalSignal = options.signal;

  if (originalSignal) {
    if (originalSignal.aborted) {
      abortController.abort(originalSignal.reason);
    } else {
      originalSignal.addEventListener(
        'abort',
        () => abortController.abort(originalSignal.reason),
        { once: true }
      );
    }
  }

  try {
    return await fetch(buildUpstreamUrl(path), {
      ...options,
      headers: buildHeaders(request, token, options.headers),
      cache: 'no-store',
      signal: abortController.signal,
    });
  } catch (error) {
    const status = isAbortError(error) ? 504 : 503;
    const message =
      error instanceof Error
        ? error.message
        : '안전 API 서버에 연결하지 못했습니다.';
    throw new SafetyServerApiError(message, status);
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function requestSafetyAdminServer<T>(
  path: string,
  options: RequestInit = {},
  token: string,
  request: Request | null = null,
): Promise<T> {
  const response = await performSafetyServerRequest(path, options, token, request);

  if (!response.ok) {
    throw new SafetyServerApiError(await parseErrorMessage(response), response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function requestSafetyAdminServerRaw(
  path: string,
  options: RequestInit = {},
  token: string,
  request: Request | null = null,
): Promise<Response> {
  const response = await performSafetyServerRequest(path, options, token, request);

  if (!response.ok) {
    throw new SafetyServerApiError(await parseErrorMessage(response), response.status);
  }

  return response;
}

export async function fetchAdminCoreData(
  token: string,
  request: Request | null = null,
): Promise<ControllerDashboardData> {
  const [users, rawHeadquarters, rawSites, assignments, contentItems] = await Promise.all([
    requestSafetyAdminServer<SafetyUser[]>(
      withQuery('/users', { active_only: true, limit: ADMIN_LIST_LIMIT }),
      {},
      token,
      request,
    ),
    requestSafetyAdminServer<SafetyHeadquarter[]>(
      withQuery('/headquarters', { active_only: true, limit: ADMIN_LIST_LIMIT }),
      {},
      token,
      request,
    ),
    requestSafetyAdminServer<SafetySite[]>(
      withQuery('/sites', {
        active_only: true,
        include_headquarter_detail: true,
        include_assigned_user: true,
        limit: ADMIN_LIST_LIMIT,
      }),
      {},
      token,
      request,
    ),
    requestSafetyAdminServer<SafetyAssignment[]>(
      withQuery('/assignments', { active_only: true, limit: ADMIN_LIST_LIMIT }),
      {},
      token,
      request,
    ),
    requestSafetyAdminServer<SafetyContentItem[]>(
      withQuery('/content-items', { active_only: true, limit: CONTENT_LIST_LIMIT }),
      {},
      token,
      request,
    ),
  ]);
  const headquarters = normalizeHeadquarterList(rawHeadquarters);
  const sites = normalizeSiteList(rawSites, headquarters);
  const visibleSiteIds = new Set(sites.map((site) => normalizeText(site.id)));

  return {
    assignments: assignments.filter((assignment) => visibleSiteIds.has(normalizeText(assignment.site_id))),
    contentItems,
    headquarters,
    sites,
    users,
  };
}

export function fetchSafetySitesServer(
  token: string,
  request: Request | null = null,
): Promise<SafetySite[]> {
  return requestSafetyAdminServer<SafetySite[]>(
    withQuery('/sites', {
      active_only: true,
      include_headquarter_detail: true,
      include_assigned_user: true,
      limit: ADMIN_LIST_LIMIT,
    }),
    {},
    token,
    request,
  ).then((sites) => normalizeSiteList(sites));
}

export function fetchSafetyHeadquartersServer(
  token: string,
  request: Request | null = null,
): Promise<SafetyHeadquarter[]> {
  return requestSafetyAdminServer<SafetyHeadquarter[]>(
    withQuery('/headquarters', {
      active_only: true,
      limit: ADMIN_LIST_LIMIT,
    }),
    {},
    token,
    request,
  ).then((headquarters) => normalizeHeadquarterList(headquarters));
}

export function fetchCurrentSafetyUserServer(
  token: string,
  request: Request | null = null,
): Promise<SafetyUser> {
  return requestSafetyAdminServer<SafetyUser>(
    '/auth/me',
    {},
    token,
    request,
  );
}

export function fetchAssignedSafetySitesServer(
  token: string,
  request: Request | null = null,
): Promise<SafetySite[]> {
  return requestSafetyAdminServer<SafetySite[]>(
    withQuery('/assignments/me/sites', {
      active_only: true,
      include_headquarter_detail: true,
      include_assigned_user: true,
      limit: ADMIN_LIST_LIMIT,
    }),
    {},
    token,
    request,
  ).then((sites) => normalizeSiteList(sites));
}

export function fetchSafetyContentItemsServer(
  token: string,
  request: Request | null = null,
): Promise<SafetyContentItem[]> {
  return requestSafetyAdminServer<SafetyContentItem[]>(
    withQuery('/content-items', {
      active_only: true,
      limit: CONTENT_LIST_LIMIT,
    }),
    {},
    token,
    request,
  );
}

export function fetchAdminReports(
  token: string,
  request: Request | null = null,
): Promise<SafetyReportListItem[]> {
  return requestSafetyAdminServer<SafetyReportListItem[]>(
    withQuery('/reports', { active_only: true, limit: REPORT_LIST_LIMIT }),
    {},
    token,
    request,
  ).then((reports) => normalizeReportList(reports));
}

export function fetchAdminReportByKey(
  token: string,
  reportKey: string,
  request: Request | null = null,
): Promise<SafetyReport> {
  return requestSafetyAdminServer<SafetyReport>(
    `/reports/by-key/${encodeURIComponent(reportKey)}`,
    {},
    token,
    request,
  ).then((report) => {
    const normalized = applyReportLifecycleStatus(report);
    if (!isVisibleReport(normalized)) {
      throw new SafetyServerApiError('蹂닿퀬?쒕? 李얠쓣 ???놁뒿?덈떎.', 404);
    }
    return normalized;
  });
}

export function fetchSafetyReportsBySiteFullServer(
  token: string,
  siteId: string,
  request: Request | null = null,
): Promise<SafetyReport[]> {
  return requestSafetyAdminServer<SafetyReport[]>(
    withQuery(`/reports/site/${encodeURIComponent(siteId)}/full`, {
      active_only: true,
    }),
    {},
    token,
    request,
  ).then((reports) => normalizeReportList(reports));
}

export function uploadSafetyAssetServer(
  token: string,
  formData: FormData,
  request: Request | null = null,
): Promise<SafetyContentAssetUpload> {
  return requestSafetyAdminServer<SafetyContentAssetUpload>(
    '/content-items/assets/upload',
    {
      method: 'POST',
      body: formData,
    },
    token,
    request,
  );
}

export function fetchAdminReportsViewServer(
  token: string,
  params: Record<string, string | number | boolean | null | undefined>,
  request: Request | null = null,
): Promise<SafetyBackendAdminReportsResponse> {
  const limit = Math.max(
    1,
    Math.min(
      REPORT_LIST_LIMIT,
      typeof params.limit === 'number' ? params.limit : Number(params.limit ?? 100) || 100,
    ),
  );
  const offset = Math.max(
    0,
    typeof params.offset === 'number' ? params.offset : Number(params.offset ?? 0) || 0,
  );

  return Promise.all([
    fetchSafetyHeadquartersServer(token, request),
    fetchSafetySitesServer(token, request),
    requestSafetyAdminServer<SafetyBackendAdminReportsResponse>(
      withQuery('/admin/reports', {
        ...params,
        limit: REPORT_LIST_LIMIT,
        offset: 0,
      }),
      {},
      token,
      request,
    ),
  ]).then(([headquarters, sites, response]) => {
    const visibleSiteIds = buildVisibleAdminSiteIdSet(sites, headquarters);
    const rows = response.rows.filter((row) => {
      const siteId = normalizeText(row.site_id);
      if (!siteId || !visibleSiteIds.has(siteId)) {
        return false;
      }

      return normalizeReportLifecycleStatus({
        lifecycleStatus: row.lifecycle_status,
        progressRate: row.progress_rate,
        status: normalizeText(row.workflow_status) || normalizeText(row.status),
        workflowStatus: row.workflow_status,
      }) !== 'deleted';
    });

    return {
      limit,
      offset,
      rows: rows.slice(offset, offset + limit),
      total: rows.length,
    };
  });
}

export function updateAdminReportReviewServer(
  token: string,
  reportKey: string,
  payload: Record<string, unknown>,
  request: Request | null = null,
) {
  return requestSafetyAdminServer<SafetyReport>(
    `/admin/reports/${encodeURIComponent(reportKey)}/review`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'application/json',
      },
    },
    token,
    request,
  );
}

export function updateAdminReportDispatchServer(
  token: string,
  reportKey: string,
  payload: Record<string, unknown>,
  request: Request | null = null,
) {
  return requestSafetyAdminServer<SafetyReport>(
    `/admin/reports/${encodeURIComponent(reportKey)}/dispatch`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'application/json',
      },
    },
    token,
    request,
  );
}

export function appendAdminDispatchEventServer(
  token: string,
  reportKey: string,
  payload: Record<string, unknown>,
  request: Request | null = null,
) {
  return requestSafetyAdminServer<SafetyReport>(
    `/admin/reports/${encodeURIComponent(reportKey)}/dispatch-events`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'application/json',
      },
    },
    token,
    request,
  );
}

export function fetchAdminOverviewServer(
  token: string,
  request: Request | null = null,
): Promise<SafetyBackendAdminOverviewResponse> {
  return requestSafetyAdminServer<SafetyBackendAdminOverviewResponse>(
    '/admin/dashboard/overview',
    {},
    token,
    request,
  );
}

export function fetchAdminAnalyticsServer(
  token: string,
  params: Record<string, string | number | boolean | null | undefined>,
  request: Request | null = null,
): Promise<SafetyBackendAdminAnalyticsResponse> {
  return requestSafetyAdminServer<SafetyBackendAdminAnalyticsResponse>(
    withQuery('/admin/dashboard/analytics', params),
    {},
    token,
    request,
  );
}

export function fetchAdminAlertsServer(
  token: string,
  request: Request | null = null,
): Promise<SafetyBackendAdminAlert[]> {
  return requestSafetyAdminServer<SafetyBackendAdminAlert[]>(
    '/admin/alerts',
    {},
    token,
    request,
  );
}

export function fetchAdminSchedulesServer(
  token: string,
  params: Record<string, string | number | boolean | null | undefined>,
  request: Request | null = null,
): Promise<SafetyBackendScheduleListResponse> {
  return requestSafetyAdminServer<SafetyBackendScheduleListResponse>(
    withQuery('/admin/schedules', params),
    {},
    token,
    request,
  );
}

export function generateAdminSchedulesServer(
  token: string,
  siteId: string,
  request: Request | null = null,
): Promise<{ rows: SafetyBackendInspectionSchedule[] }> {
  return requestSafetyAdminServer<{ rows: SafetyBackendInspectionSchedule[] }>(
    `/admin/sites/${encodeURIComponent(siteId)}/schedules/generate`,
    {
      method: 'POST',
    },
    token,
    request,
  );
}

export function updateAdminScheduleServer(
  token: string,
  scheduleId: string,
  payload: Record<string, unknown>,
  request: Request | null = null,
): Promise<SafetyBackendInspectionSchedule> {
  return requestSafetyAdminServer<SafetyBackendInspectionSchedule>(
    `/admin/schedules/${encodeURIComponent(scheduleId)}`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'application/json',
      },
    },
    token,
    request,
  );
}

export function fetchSafetyPhotoAssetsServer(
  token: string,
  params: Record<string, string | number | boolean | Array<string | number | boolean> | null | undefined>,
  request: Request | null = null,
): Promise<SafetyBackendPhotoAssetListResponse> {
  return requestSafetyAdminServer<SafetyBackendPhotoAssetListResponse>(
    withQuery('/photo-assets', params),
    {},
    token,
    request,
  );
}

export function parseExcelImportServer(
  token: string,
  formData: FormData,
  request: Request | null = null,
): Promise<SafetyBackendExcelImportPreview> {
  return requestSafetyAdminServer<SafetyBackendExcelImportPreview>(
    '/excel-imports/parse',
    {
      method: 'POST',
      body: formData,
    },
    token,
    request,
  );
}

export function fetchExcelImportPreviewServer(
  token: string,
  jobId: string,
  request: Request | null = null,
): Promise<SafetyBackendExcelImportPreview> {
  return requestSafetyAdminServer<SafetyBackendExcelImportPreview>(
    `/excel-imports/${encodeURIComponent(jobId)}`,
    {},
    token,
    request,
  );
}

export function applyExcelImportServer(
  token: string,
  payload: Record<string, unknown>,
  request: Request | null = null,
): Promise<SafetyBackendExcelApplyResult> {
  return requestSafetyAdminServer<SafetyBackendExcelApplyResult>(
    '/excel-imports/apply',
    {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'application/json',
      },
    },
    token,
    request,
  );
}

export function uploadSafetyPhotoAssetServer(
  token: string,
  formData: FormData,
  request: Request | null = null,
): Promise<SafetyBackendPhotoAsset> {
  return requestSafetyAdminServer<SafetyBackendPhotoAsset>(
    '/photo-assets/upload',
    {
      method: 'POST',
      body: formData,
    },
    token,
    request,
  );
}

export function downloadSafetyPhotoAssetServer(
  token: string,
  assetId: string,
  request: Request | null = null,
) {
  return requestSafetyAdminServerRaw(
    `/photo-assets/${encodeURIComponent(assetId)}/download`,
    {},
    token,
    request,
  );
}

export function updateAdminReport(
  token: string,
  payload: Record<string, unknown>,
  request: Request | null = null,
): Promise<SafetyReportListItem> {
  return requestSafetyAdminServer<SafetyReportListItem>(
    '/reports/upsert',
    {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'application/json',
      },
    },
    token,
    request,
  );
}

export function fetchSafetyMailAccountsServer(
  token: string,
  request: Request | null = null,
): Promise<{ rows: SafetyBackendMailAccount[] }> {
  return requestSafetyAdminServer<{ rows: SafetyBackendMailAccount[] }>(
    '/mail/accounts',
    {},
    token,
    request,
  );
}

export function fetchMailProviderStatusServer(
  token: string,
  params: Record<string, string | number | boolean | null | undefined>,
  request: Request | null = null,
): Promise<SafetyBackendMailProviderStatusResponse> {
  return requestSafetyAdminServer<SafetyBackendMailProviderStatusResponse>(
    withQuery('/mail/providers/status', params),
    {},
    token,
    request,
  );
}

export function startGoogleMailConnectionServer(
  token: string,
  payload: Record<string, unknown>,
  request: Request | null = null,
): Promise<{ authorization_url: string; provider?: string; state: string }> {
  return requestSafetyAdminServer<{ authorization_url: string; provider?: string; state: string }>(
    '/mail/accounts/connect/google/start',
    {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' },
    },
    token,
    request,
  );
}

export function completeGoogleMailConnectionServer(
  token: string,
  payload: Record<string, unknown>,
  request: Request | null = null,
): Promise<SafetyBackendMailAccount> {
  return requestSafetyAdminServer<SafetyBackendMailAccount>(
    '/mail/accounts/connect/google/complete',
    {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' },
    },
    token,
    request,
  );
}

export function startNaverMailConnectionServer(
  token: string,
  payload: Record<string, unknown>,
  request: Request | null = null,
): Promise<{ authorization_url: string; provider?: string; state: string }> {
  return requestSafetyAdminServer<{ authorization_url: string; provider?: string; state: string }>(
    '/mail/accounts/connect/naver/start',
    {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' },
    },
    token,
    request,
  );
}

export function completeNaverMailConnectionServer(
  token: string,
  payload: Record<string, unknown>,
  request: Request | null = null,
): Promise<SafetyBackendMailAccount> {
  return requestSafetyAdminServer<SafetyBackendMailAccount>(
    '/mail/accounts/connect/naver/complete',
    {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' },
    },
    token,
    request,
  );
}

export function connectNaverMailServer(
  token: string,
  payload: Record<string, unknown>,
  request: Request | null = null,
): Promise<SafetyBackendMailAccount> {
  return requestSafetyAdminServer<SafetyBackendMailAccount>(
    '/mail/accounts/connect/naver',
    {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' },
    },
    token,
    request,
  );
}

export function disconnectMailAccountServer(
  token: string,
  accountId: string,
  request: Request | null = null,
) {
  return requestSafetyAdminServer<void>(
    `/mail/accounts/${encodeURIComponent(accountId)}`,
    {
      method: 'DELETE',
    },
    token,
    request,
  );
}

export function fetchSafetyMailThreadsServer(
  token: string,
  params: Record<string, string | number | boolean | null | undefined>,
  request: Request | null = null,
): Promise<{ rows: SafetyBackendMailThread[]; total: number; limit: number; offset: number }> {
  return requestSafetyAdminServer<{ rows: SafetyBackendMailThread[]; total: number; limit: number; offset: number }>(
    withQuery('/mail/threads', params),
    {},
    token,
    request,
  );
}

export function fetchSafetyMailThreadDetailServer(
  token: string,
  threadId: string,
  request: Request | null = null,
): Promise<SafetyBackendMailThreadDetail> {
  return requestSafetyAdminServer<SafetyBackendMailThreadDetail>(
    `/mail/threads/${encodeURIComponent(threadId)}`,
    {},
    token,
    request,
  );
}

export function fetchSafetyMailMessageServer(
  token: string,
  messageId: string,
  request: Request | null = null,
): Promise<SafetyBackendMailMessage> {
  return requestSafetyAdminServer<SafetyBackendMailMessage>(
    `/mail/messages/${encodeURIComponent(messageId)}`,
    {},
    token,
    request,
  );
}

export function sendSafetyMailServer(
  token: string,
  payload: Record<string, unknown>,
  request: Request | null = null,
): Promise<SafetyBackendMailMessage> {
  return requestSafetyAdminServer<SafetyBackendMailMessage>(
    '/mail/send',
    {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' },
    },
    token,
    request,
  );
}

export function syncSafetyMailServer(
  token: string,
  request: Request | null = null,
): Promise<{ synced_account_count: number; thread_count: number; message_count: number }> {
  return requestSafetyAdminServer<{ synced_account_count: number; thread_count: number; message_count: number }>(
    '/mail/sync',
    {
      method: 'POST',
    },
    token,
    request,
  );
}

export function fetchSmsProviderStatusServer(
  token: string,
  request: Request | null = null,
): Promise<SafetyBackendSmsProviderStatusResponse> {
  return requestSafetyAdminServer<SafetyBackendSmsProviderStatusResponse>(
    '/messages/providers/status',
    {},
    token,
    request,
  );
}

export function sendSafetySmsServer(
  token: string,
  payload: Record<string, unknown>,
  request: Request | null = null,
): Promise<SafetyBackendSmsSendResponse> {
  return requestSafetyAdminServer<SafetyBackendSmsSendResponse>(
    '/messages/sms/send',
    {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' },
    },
    token,
    request,
  );
}

export function fetchNotificationsServer(
  token: string,
  request: Request | null = null,
): Promise<SafetyBackendNotificationFeedResponse> {
  return requestSafetyAdminServer<SafetyBackendNotificationFeedResponse>(
    '/notifications',
    {},
    token,
    request,
  );
}

export function fetchWorkerSchedulesServer(
  token: string,
  params: Record<string, string | number | boolean | null | undefined>,
  request: Request | null = null,
): Promise<SafetyBackendScheduleListResponse> {
  return requestSafetyAdminServer<SafetyBackendScheduleListResponse>(
    withQuery('/me/schedules', params),
    {},
    token,
    request,
  );
}

export function updateWorkerScheduleServer(
  token: string,
  scheduleId: string,
  payload: Record<string, unknown>,
  request: Request | null = null,
): Promise<SafetyBackendInspectionSchedule> {
  return requestSafetyAdminServer<SafetyBackendInspectionSchedule>(
    `/me/schedules/${encodeURIComponent(scheduleId)}`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'application/json',
      },
    },
    token,
    request,
  );
}

export function acknowledgeNotificationServer(
  token: string,
  notificationId: string,
  request: Request | null = null,
): Promise<{ acknowledged_ids: string[] }> {
  return requestSafetyAdminServer<{ acknowledged_ids: string[] }>(
    `/notifications/${encodeURIComponent(notificationId)}/ack`,
    {
      method: 'POST',
    },
    token,
    request,
  );
}

export function acknowledgeAllNotificationsServer(
  token: string,
  request: Request | null = null,
): Promise<{ acknowledged_ids: string[] }> {
  return requestSafetyAdminServer<{ acknowledged_ids: string[] }>(
    '/notifications/ack-all',
    {
      method: 'POST',
    },
    token,
    request,
  );
}

export function updateAdminSite(
  token: string,
  siteId: string,
  payload: SafetySiteInput | SafetySiteUpdateInput,
  request: Request | null = null,
): Promise<SafetySite> {
  return requestSafetyAdminServer<SafetySite>(
    `/sites/${encodeURIComponent(siteId)}`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'application/json',
      },
    },
    token,
    request,
  );
}

export function createAdminHeadquarter(
  token: string,
  payload: SafetyHeadquarterInput | SafetyHeadquarterUpdateInput,
  request: Request | null = null,
): Promise<SafetyHeadquarter> {
  return requestSafetyAdminServer<SafetyHeadquarter>(
    '/headquarters',
    {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'application/json',
      },
    },
    token,
    request,
  );
}

export function updateAdminHeadquarter(
  token: string,
  headquarterId: string,
  payload: SafetyHeadquarterInput | SafetyHeadquarterUpdateInput,
  request: Request | null = null,
): Promise<SafetyHeadquarter> {
  return requestSafetyAdminServer<SafetyHeadquarter>(
    `/headquarters/${encodeURIComponent(headquarterId)}`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'application/json',
      },
    },
    token,
    request,
  );
}

export function createAdminSite(
  token: string,
  payload: SafetySiteInput | SafetySiteUpdateInput,
  request: Request | null = null,
): Promise<SafetySite> {
  return requestSafetyAdminServer<SafetySite>(
    '/sites',
    {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'application/json',
      },
    },
    token,
    request,
  );
}

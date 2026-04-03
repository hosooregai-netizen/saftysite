import { getSafetyApiUpstreamBaseUrl } from '@/lib/safetyApi/upstream';
import type { SafetyContentAssetUpload } from '@/lib/safetyApi/adminEndpoints';
import type {
  SafetyBackendAdminAlert,
  SafetyBackendAdminAnalyticsResponse,
  SafetyBackendAdminOverviewResponse,
  SafetyBackendAdminReportsResponse,
  SafetyBackendInspectionSchedule,
  SafetyBackendPhotoAsset,
  SafetyBackendPhotoAssetListResponse,
  SafetyBackendScheduleListResponse,
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
  SafetySiteInput,
  SafetySiteUpdateInput,
} from '@/types/controller';

const ADMIN_LIST_LIMIT = 500;
const CONTENT_LIST_LIMIT = 1000;
const REPORT_LIST_LIMIT = 500;

export class SafetyServerApiError extends Error {
  status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.name = 'SafetyServerApiError';
    this.status = status;
  }
}

function withQuery(
  path: string,
  params: Record<string, string | number | boolean | null | undefined>,
) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === null || value === undefined || value === '') return;
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

export function readRequiredAdminToken(request: Request) {
  const authorization = request.headers.get('authorization') || '';
  const matched = authorization.match(/^Bearer\s+(.+)$/i);
  const token = matched?.[1]?.trim() || '';

  if (!token) {
    throw new SafetyServerApiError('로그인이 만료되었습니다. 다시 로그인해 주세요.', 401);
  }

  return token;
}

export async function requestSafetyAdminServer<T>(
  path: string,
  options: RequestInit = {},
  token: string,
  request: Request | null = null,
): Promise<T> {
  const response = await fetch(buildUpstreamUrl(path), {
    ...options,
    headers: buildHeaders(request, token, options.headers),
    cache: 'no-store',
  });

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
  const response = await fetch(buildUpstreamUrl(path), {
    ...options,
    headers: buildHeaders(request, token, options.headers),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new SafetyServerApiError(await parseErrorMessage(response), response.status);
  }

  return response;
}

export async function fetchAdminCoreData(
  token: string,
  request: Request | null = null,
): Promise<ControllerDashboardData> {
  const [users, headquarters, sites, assignments, contentItems] = await Promise.all([
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

  return {
    assignments,
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
  );
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
  );
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
  );
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
  );
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
  return requestSafetyAdminServer<SafetyBackendAdminReportsResponse>(
    withQuery('/admin/reports', params),
    {},
    token,
    request,
  );
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
  params: Record<string, string | number | boolean | null | undefined>,
  request: Request | null = null,
): Promise<SafetyBackendPhotoAssetListResponse> {
  return requestSafetyAdminServer<SafetyBackendPhotoAssetListResponse>(
    withQuery('/photo-assets', params),
    {},
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

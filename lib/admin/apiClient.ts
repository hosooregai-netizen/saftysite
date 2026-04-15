'use client';

import { readSafetyAuthToken, SafetyApiError } from '@/lib/safetyApi';
import type {
  SafetyAdminDirectoryLookupsResponse,
  ReportControllerReview,
  ReportDispatchHistoryEntry,
  ReportDispatchMeta,
  SafetyAdminAlert,
  SafetyAdminAnalyticsResponse,
  SafetyAdminHeadquarterListResponse,
  SafetyAdminOverviewResponse,
  SafetyAdminReportsResponse,
  SafetyAdminScheduleCalendarResponse,
  SafetyAdminSiteListResponse,
  SafetyAdminScheduleListResponse,
  SafetyAdminScheduleLookupsResponse,
  SafetyAdminScheduleQueueResponse,
  SafetyAdminReportSessionBootstrapResponse,
  SafetyAdminUserListResponse,
  SafetyInspectionSchedule,
  TableSortDirection,
} from '@/types/admin';
import type { SafetyReport } from '@/types/backend';

function buildQueryString(params: Record<string, string | number | null | undefined>) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === null || value === undefined || value === '') return;
    searchParams.set(key, String(value));
  });

  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

async function parseErrorMessage(response: Response) {
  try {
    const payload = (await response.json()) as Record<string, unknown>;
    if (typeof payload.error === 'string' && payload.error.trim()) return payload.error;
    if (typeof payload.detail === 'string' && payload.detail.trim()) return payload.detail;
  } catch {
    // ignore
  }

  return response.statusText || '요청 처리 중 오류가 발생했습니다.';
}

export async function requestAdminApi<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = readSafetyAuthToken();
  if (!token) {
    throw new SafetyApiError('로그인이 만료되었습니다. 다시 로그인해 주세요.', 401);
  }

  const headers = new Headers(options.headers);
  headers.set('Authorization', `Bearer ${token}`);

  if (!headers.has('Content-Type') && options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`/api/admin${path}`, {
    ...options,
    headers,
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new SafetyApiError(await parseErrorMessage(response), response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export function fetchAdminReports(input: {
  assigneeUserId?: string;
  dateFrom?: string;
  dateTo?: string;
  dispatchStatus?: string;
  headquarterId?: string;
  limit?: number;
  offset?: number;
  qualityStatus?: string;
  query?: string;
  reportType?: string;
  siteId?: string;
  sortDir?: TableSortDirection;
  sortBy?: string;
  status?: string;
}, options: RequestInit = {}) {
  return requestAdminApi<SafetyAdminReportsResponse>(
    `/reports${buildQueryString({
      assignee_user_id: input.assigneeUserId,
      date_from: input.dateFrom,
      date_to: input.dateTo,
      dispatch_status: input.dispatchStatus,
      headquarter_id: input.headquarterId,
      limit: input.limit,
      offset: input.offset,
      quality_status: input.qualityStatus,
      query: input.query,
      report_type: input.reportType,
      site_id: input.siteId,
      sort_by: input.sortBy,
      sort_dir: input.sortDir,
      status: input.status,
    })}`,
    options,
  );
}

export function updateAdminReportReview(
  reportKey: string,
  review: ReportControllerReview,
) {
  return requestAdminApi(`/reports/${encodeURIComponent(reportKey)}/review`, {
    method: 'PATCH',
    body: JSON.stringify(review),
  });
}

export function updateAdminReportDispatch(
  reportKey: string,
  dispatch: ReportDispatchMeta,
) {
  return requestAdminApi<SafetyReport>(`/reports/${encodeURIComponent(reportKey)}/dispatch`, {
    method: 'PATCH',
    body: JSON.stringify(dispatch),
  });
}

export function appendAdminDispatchEvent(
  reportKey: string,
  event: ReportDispatchHistoryEntry,
) {
  return requestAdminApi(`/reports/${encodeURIComponent(reportKey)}/dispatch-events`, {
    method: 'POST',
    body: JSON.stringify(event),
  });
}

export function fetchAdminReportSessionBootstrap(
  reportKey: string,
  options: RequestInit = {},
) {
  return requestAdminApi<SafetyAdminReportSessionBootstrapResponse>(
    `/reports/${encodeURIComponent(reportKey)}/session-bootstrap`,
    options,
  );
}

export function fetchAdminOverview() {
  return requestAdminApi<SafetyAdminOverviewResponse>('/dashboard/overview');
}

export function fetchAdminDashboardLookups() {
  return requestAdminApi<{
    contractTypes: Array<{ label: string; value: string }>;
    headquarters: Array<{ id: string; name: string }>;
    users: Array<{ id: string; name: string }>;
  }>('/dashboard/lookups');
}

export function fetchAdminDirectoryLookups(options: RequestInit = {}) {
  return requestAdminApi<SafetyAdminDirectoryLookupsResponse>('/directory/lookups', options);
}

export function fetchAdminUsersList(input: {
  limit?: number;
  offset?: number;
  query?: string;
  role?: string;
  sortDir?: TableSortDirection;
  sortBy?: string;
  status?: string;
}, options: RequestInit = {}) {
  return requestAdminApi<SafetyAdminUserListResponse>(
    `/users/list${buildQueryString({
      limit: input.limit,
      offset: input.offset,
      query: input.query,
      role: input.role,
      sort_by: input.sortBy,
      sort_dir: input.sortDir,
      status: input.status,
    })}`,
    options,
  );
}

export function fetchAdminHeadquartersList(input: {
  id?: string;
  limit?: number;
  offset?: number;
  query?: string;
  sortDir?: TableSortDirection;
  sortBy?: string;
}, options: RequestInit = {}) {
  return requestAdminApi<SafetyAdminHeadquarterListResponse>(
    `/headquarters/list${buildQueryString({
      id: input.id,
      limit: input.limit,
      offset: input.offset,
      query: input.query,
      sort_by: input.sortBy,
      sort_dir: input.sortDir,
    })}`,
    options,
  );
}

export function fetchAdminSitesList(input: {
  assignment?: string;
  headquarterId?: string;
  limit?: number;
  offset?: number;
  query?: string;
  siteId?: string;
  sortDir?: TableSortDirection;
  sortBy?: string;
  status?: string;
}, options: RequestInit = {}) {
  return requestAdminApi<SafetyAdminSiteListResponse>(
    `/sites/list${buildQueryString({
      assignment: input.assignment,
      headquarter_id: input.headquarterId,
      limit: input.limit,
      offset: input.offset,
      query: input.query,
      site_id: input.siteId,
      sort_by: input.sortBy,
      sort_dir: input.sortDir,
      status: input.status,
    })}`,
    options,
  );
}

export function fetchAdminAnalytics(input: {
  contractType?: string;
  headquarterId?: string;
  period?: string;
  query?: string;
  userId?: string;
}, options: RequestInit = {}) {
  return requestAdminApi<SafetyAdminAnalyticsResponse>(
    `/dashboard/analytics${buildQueryString({
      contract_type: input.contractType,
      headquarter_id: input.headquarterId,
      period: input.period,
      query: input.query,
      user_id: input.userId,
    })}`,
    options,
  );
}

export function refreshAdminAnalyticsSnapshot() {
  return requestAdminApi<{ ok: boolean; refreshedAt: string }>('/dashboard/analytics/refresh', {
    method: 'POST',
  });
}

export function fetchAdminAlerts() {
  return requestAdminApi<SafetyAdminAlert[]>('/alerts');
}

export function fetchAdminSchedules(input: {
  assigneeUserId?: string;
  limit?: number;
  month?: string;
  offset?: number;
  plannedDate?: string;
  query?: string;
  siteId?: string;
  sortDir?: TableSortDirection;
  sortBy?: string;
  status?: string;
}) {
  return requestAdminApi<SafetyAdminScheduleListResponse>(
    `/schedules${buildQueryString({
      assignee_user_id: input.assigneeUserId,
      limit: input.limit,
      month: input.month,
      offset: input.offset,
      planned_date: input.plannedDate,
      query: input.query,
      site_id: input.siteId,
      sort_by: input.sortBy,
      sort_dir: input.sortDir,
      status: input.status,
    })}`,
  );
}

export function fetchAdminScheduleCalendar(input: {
  assigneeUserId?: string;
  month?: string;
  query?: string;
  siteId?: string;
  status?: string;
}, options: RequestInit = {}) {
  return requestAdminApi<SafetyAdminScheduleCalendarResponse>(
    `/schedules/calendar${buildQueryString({
      assignee_user_id: input.assigneeUserId,
      month: input.month,
      query: input.query,
      site_id: input.siteId,
      status: input.status,
    })}`,
    options,
  );
}

export function fetchAdminScheduleQueue(input: {
  assigneeUserId?: string;
  limit?: number;
  month?: string;
  offset?: number;
  query?: string;
  siteId?: string;
  status?: string;
}, options: RequestInit = {}) {
  return requestAdminApi<SafetyAdminScheduleQueueResponse>(
    `/schedules/queue${buildQueryString({
      assignee_user_id: input.assigneeUserId,
      limit: input.limit,
      month: input.month,
      offset: input.offset,
      query: input.query,
      site_id: input.siteId,
      status: input.status,
    })}`,
    options,
  );
}

export function fetchAdminScheduleLookups(options: RequestInit = {}) {
  return requestAdminApi<SafetyAdminScheduleLookupsResponse>('/schedules/lookups', options);
}

export function generateAdminSchedules(siteId: string) {
  return requestAdminApi<{ rows: SafetyInspectionSchedule[] }>(
    `/sites/${encodeURIComponent(siteId)}/schedules/generate`,
    {
      method: 'POST',
    },
  );
}

export function updateAdminSchedule(
  scheduleId: string,
  payload: Partial<SafetyInspectionSchedule>,
) {
  return requestAdminApi<SafetyInspectionSchedule>(
    `/schedules/${encodeURIComponent(scheduleId)}`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
  );
}

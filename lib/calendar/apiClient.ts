'use client';

import { readSafetyAuthToken, SafetyApiError } from '@/lib/safetyApi';
import type { SafetyAdminScheduleListResponse, SafetyInspectionSchedule } from '@/types/admin';

type MyScheduleUpdateInput = {
  actualVisitDate?: string;
  linkedReportKey?: string;
  plannedDate?: string;
  selectionReasonLabel?: string;
  selectionReasonMemo?: string;
  status?: SafetyInspectionSchedule['status'];
};

function buildQueryString(params: Record<string, boolean | string | number | null | undefined>) {
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

async function requestCalendarApi<T>(path: string, options: RequestInit = {}) {
  const token = readSafetyAuthToken();
  if (!token) {
    throw new SafetyApiError('로그인이 만료되었습니다. 다시 로그인해 주세요.', 401);
  }

  const headers = new Headers(options.headers);
  headers.set('Authorization', `Bearer ${token}`);

  if (!headers.has('Content-Type') && options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`/api/me${path}`, {
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

export function fetchMySchedules(input: {
  includeAll?: boolean;
  limit?: number;
  month?: string;
  offset?: number;
  siteId?: string;
  status?: string;
}) {
  return requestCalendarApi<SafetyAdminScheduleListResponse>(buildFetchMySchedulesPath(input));
}

export function buildFetchMySchedulesPath(input: {
  includeAll?: boolean;
  limit?: number;
  month?: string;
  offset?: number;
  siteId?: string;
  status?: string;
}) {
  return `/schedules${buildQueryString({
    include_all: input.includeAll,
    limit: input.limit,
    month: input.month,
    offset: input.offset,
    siteId: input.siteId,
    status: input.status,
  })}`;
}

export function buildUpdateMyScheduleBody(payload: MyScheduleUpdateInput) {
  const body: Record<string, string> = {};

  if (payload.actualVisitDate !== undefined) {
    body.actual_visit_date = payload.actualVisitDate;
  }
  if (payload.linkedReportKey !== undefined) {
    body.linked_report_key = payload.linkedReportKey;
  }
  if (payload.plannedDate !== undefined) {
    body.planned_date = payload.plannedDate;
  }
  if (payload.selectionReasonLabel !== undefined) {
    body.selection_reason_label = payload.selectionReasonLabel;
  }
  if (payload.selectionReasonMemo !== undefined) {
    body.selection_reason_memo = payload.selectionReasonMemo;
  }
  if (payload.status !== undefined) {
    body.status = payload.status;
  }

  return body;
}

export function updateMySchedule(
  scheduleId: string,
  payload: MyScheduleUpdateInput,
) {
  return requestCalendarApi<SafetyInspectionSchedule>(`/schedules/${encodeURIComponent(scheduleId)}`, {
    method: 'PATCH',
    body: JSON.stringify(buildUpdateMyScheduleBody(payload)),
  });
}

export function reserveNextMySchedule(payload: {
  plannedDate: string;
  selectionReasonLabel?: string;
  selectionReasonMemo?: string;
  siteId: string;
}) {
  return requestCalendarApi<SafetyInspectionSchedule>('/schedules/next', {
    method: 'POST',
    body: JSON.stringify({
      planned_date: payload.plannedDate || '',
      selection_reason_label: payload.selectionReasonLabel || '',
      selection_reason_memo: payload.selectionReasonMemo || '',
      site_id: payload.siteId || '',
    }),
  });
}

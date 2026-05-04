'use client';

import { readSafetyAuthToken, SafetyApiError } from '@/lib/safetyApi';
import type { SafetyAdminScheduleListResponse, SafetyInspectionSchedule } from '@/types/admin';

const MY_SCHEDULE_PAGE_LIMIT = 300;
const inFlightCalendarGetRequests = new Map<string, Promise<unknown>>();

type MyScheduleUpdateInput = {
  linkedReportKey?: string;
  plannedDate?: string;
  selectionReasonLabel?: string;
  selectionReasonMemo?: string;
  status?: SafetyInspectionSchedule['status'];
};

type MyScheduleListInput = {
  includeAll?: boolean;
  limit?: number;
  month?: string;
  offset?: number;
  siteId?: string;
  status?: string;
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

  const method = (options.method || 'GET').toUpperCase();
  const headers = new Headers(options.headers);
  headers.set('Authorization', `Bearer ${token}`);

  if (!headers.has('Content-Type') && options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const executeRequest = async () => {
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
  };

  if (method === 'GET' || method === 'HEAD') {
    const requestKey = `${method}:${token}:${path}`;
    const pending = inFlightCalendarGetRequests.get(requestKey);
    if (pending) {
      return pending as Promise<T>;
    }
    const requestPromise = executeRequest().finally(() => {
      if (inFlightCalendarGetRequests.get(requestKey) === requestPromise) {
        inFlightCalendarGetRequests.delete(requestKey);
      }
    });
    inFlightCalendarGetRequests.set(requestKey, requestPromise);
    return requestPromise;
  }

  return executeRequest();
}

export function fetchMySchedules(input: MyScheduleListInput) {
  return requestCalendarApi<SafetyAdminScheduleListResponse>(buildFetchMySchedulesPath(input));
}

export async function fetchAllMySchedules(input: MyScheduleListInput) {
  const initialOffset = Math.max(0, input.offset ?? 0);
  let offset = initialOffset;
  let firstResponse: SafetyAdminScheduleListResponse | null = null;
  const rows: SafetyInspectionSchedule[] = [];

  for (;;) {
    const response = await fetchMySchedules({
      ...input,
      limit: MY_SCHEDULE_PAGE_LIMIT,
      offset,
    });
    firstResponse ??= response;
    rows.push(...response.rows);

    const nextOffset = offset + response.rows.length;
    const total = response.total ?? rows.length;
    const pageLimit = response.limit || MY_SCHEDULE_PAGE_LIMIT;

    if (response.rows.length === 0 || nextOffset >= total || response.rows.length < pageLimit) {
      return {
        ...response,
        limit: firstResponse.limit,
        month: firstResponse.month,
        offset: initialOffset,
        rows,
        total,
      };
    }

    offset = nextOffset;
  }
}

export function buildFetchMySchedulesPath(input: MyScheduleListInput) {
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

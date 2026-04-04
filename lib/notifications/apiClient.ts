'use client';

import { readSafetyAuthToken, SafetyApiError } from '@/lib/safetyApi';
import type { NotificationFeedResponse } from '@/types/notifications';

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

async function requestNotificationsApi<T>(
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

  const response = await fetch(`/api/notifications${path}`, {
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

export function fetchNotifications() {
  return requestNotificationsApi<NotificationFeedResponse>('');
}

export function acknowledgeNotification(notificationId: string) {
  return requestNotificationsApi<{ acknowledged_ids: string[] }>(
    `/${encodeURIComponent(notificationId)}/ack`,
    { method: 'POST' },
  );
}

export function acknowledgeAllNotifications() {
  return requestNotificationsApi<{ acknowledged_ids: string[] }>('/ack-all', {
    method: 'POST',
  });
}

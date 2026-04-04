'use client';

import { readSafetyAuthToken, SafetyApiError } from '@/lib/safetyApi';
import type { SmsProviderStatus, SmsSendResult } from '@/types/messages';

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

async function requestMessagesApi<T>(path: string, options: RequestInit = {}) {
  const token = readSafetyAuthToken();
  if (!token) {
    throw new SafetyApiError('로그인이 만료되었습니다. 다시 로그인해 주세요.', 401);
  }

  const headers = new Headers(options.headers);
  headers.set('Authorization', `Bearer ${token}`);
  if (!headers.has('Content-Type') && options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`/api/messages${path}`, {
    ...options,
    headers,
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function fetchSmsProviderStatuses() {
  const response = await requestMessagesApi<{ rows: SmsProviderStatus[] }>('/providers/status');
  return response.rows;
}

export function sendSms(input: {
  content: string;
  headquarterId?: string;
  phoneNumber: string;
  reportKey?: string;
  siteId?: string;
  subject?: string;
}) {
  return requestMessagesApi<SmsSendResult>('/sms/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: input.content,
      headquarter_id: input.headquarterId || '',
      phone_number: input.phoneNumber,
      report_key: input.reportKey || '',
      site_id: input.siteId || '',
      subject: input.subject || '',
    }),
  });
}

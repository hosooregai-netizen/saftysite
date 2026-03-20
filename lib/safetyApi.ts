'use client';

import type {
  SafetyContentItem,
  SafetyLoginInput,
  SafetyReport,
  SafetySite,
  SafetyTokenResponse,
  SafetyUpsertReportInput,
  SafetyUser,
} from '@/types/backend';

const DEFAULT_SAFETY_API_BASE_URL = 'http://35.76.230.177:8011/api/v1';
export const SAFETY_AUTH_TOKEN_KEY = 'safety-api-access-token';

function normalizeBaseUrl(value: string): string {
  return value.replace(/\/+$/, '');
}

export function getSafetyApiBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SAFETY_API_BASE_URL?.trim();
  if (configured) {
    return normalizeBaseUrl(configured);
  }

  return DEFAULT_SAFETY_API_BASE_URL;
}

function buildSafetyApiUrl(path: string): string {
  const baseUrl = getSafetyApiBaseUrl();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
}

function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(SAFETY_AUTH_TOKEN_KEY);
}

export function readSafetyAuthToken(): string | null {
  return getStoredToken();
}

export function writeSafetyAuthToken(token: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(SAFETY_AUTH_TOKEN_KEY, token);
}

export function clearSafetyAuthToken(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(SAFETY_AUTH_TOKEN_KEY);
}

export class SafetyApiError extends Error {
  status: number | null;

  constructor(message: string, status: number | null = null) {
    super(message);
    this.name = 'SafetyApiError';
    this.status = status;
  }
}

async function parseErrorMessage(response: Response): Promise<string> {
  const contentType = response.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    try {
      const payload = (await response.json()) as Record<string, unknown>;
      const detail = payload.detail;

      if (typeof detail === 'string' && detail.trim()) {
        return detail;
      }

      if (Array.isArray(detail)) {
        return detail
          .map((item) => {
            if (!item || typeof item !== 'object') return '';
            const record = item as Record<string, unknown>;
            return typeof record.msg === 'string' ? record.msg : '';
          })
          .filter(Boolean)
          .join(', ');
      }
    } catch {
      return response.statusText || '요청 처리 중 오류가 발생했습니다.';
    }
  }

  const text = await response.text();
  return text || response.statusText || '요청 처리 중 오류가 발생했습니다.';
}

async function requestSafetyApi<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  const headers = new Headers(options.headers);

  if (!headers.has('Content-Type') && options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response: Response;

  try {
    response = await fetch(buildSafetyApiUrl(path), {
      ...options,
      headers,
      cache: 'no-store',
    });
  } catch (error) {
    throw new SafetyApiError(
      error instanceof Error ? error.message : '안전 API 서버에 연결하지 못했습니다.',
      null
    );
  }

  if (!response.ok) {
    throw new SafetyApiError(await parseErrorMessage(response), response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
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
    include_headquarter_detail: 'true',
    include_assigned_user: 'true',
  });

  return requestSafetyApi<SafetySite[]>(
    `/assignments/me/sites?${searchParams.toString()}`,
    {},
    token
  );
}

export function fetchSafetyContentItems(token: string): Promise<SafetyContentItem[]> {
  return requestSafetyApi<SafetyContentItem[]>('/content-items', {}, token);
}

export function fetchSafetyReportsBySite(
  token: string,
  siteId: string
): Promise<SafetyReport[]> {
  return requestSafetyApi<SafetyReport[]>(`/reports/site/${siteId}/full`, {}, token);
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

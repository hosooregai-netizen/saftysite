'use client';

import { readSafetyAuthToken, SafetyApiError } from '@/lib/safetyApi';
import { buildPublicSafetyApiUpstreamUrl } from '@/lib/safetyApi/upstream';
import type { K2bApplyResult, K2bImportPreview, K2bImportScope } from '@/types/k2b';

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

function createAuthHeaders(options?: { json?: boolean }) {
  const token = readSafetyAuthToken();
  if (!token) {
    throw new SafetyApiError('로그인이 만료되었습니다. 다시 로그인해 주세요.', 401);
  }
  const headers = new Headers();
  headers.set('Authorization', `Bearer ${token}`);
  if (options?.json) {
    headers.set('Content-Type', 'application/json');
  }
  return headers;
}

function appendScope(body: FormData, scope?: K2bImportScope) {
  if (!scope) return;
  body.set('sourceSection', scope.sourceSection);
  body.set('source_section', scope.sourceSection);
  if (scope.headquarterId?.trim()) {
    body.set('headquarterId', scope.headquarterId);
    body.set('headquarter_id', scope.headquarterId);
  }
  if (scope.siteId?.trim()) {
    body.set('siteId', scope.siteId);
    body.set('site_id', scope.siteId);
  }
}

function buildDirectK2bUrl(path: string) {
  return buildPublicSafetyApiUpstreamUrl(`/k2b/imports${path}`);
}

async function requestK2b<T>(
  path: string,
  init: RequestInit,
  options?: {
    fallbackPath?: string;
  },
): Promise<T> {
  const directUrl = buildDirectK2bUrl(path);
  const response = await fetch(directUrl ?? options?.fallbackPath ?? path, {
    ...init,
    headers: init.headers,
  });
  if (!response.ok) {
    throw new SafetyApiError(await parseErrorMessage(response), response.status);
  }
  return (await response.json()) as T;
}

export async function parseK2bWorkbook(
  file: File,
  scope?: K2bImportScope,
): Promise<K2bImportPreview> {
  const headers = createAuthHeaders();
  const body = new FormData();
  body.set('file', file, file.name);
  appendScope(body, scope);
  return requestK2b<K2bImportPreview>('/parse', {
    method: 'POST',
    body,
    headers,
  }, {
    fallbackPath: '/api/k2b/imports/parse',
  });
}

export async function fetchK2bImportPreview(jobId: string): Promise<K2bImportPreview> {
  const headers = createAuthHeaders();
  return requestK2b<K2bImportPreview>(`/${encodeURIComponent(jobId)}`, {
    cache: 'no-store',
    headers,
  }, {
    fallbackPath: `/api/k2b/imports/${encodeURIComponent(jobId)}`,
  });
}

export async function applyK2bWorkbook(input: {
  jobId: string;
  sheetName: string;
  scope?: K2bImportScope;
}): Promise<K2bApplyResult> {
  const headers = createAuthHeaders({ json: true });
  return requestK2b<K2bApplyResult>('/apply', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      job_id: input.jobId,
      sheet_name: input.sheetName,
      scope: input.scope
        ? {
            source_section: input.scope.sourceSection,
            headquarter_id: input.scope.headquarterId ?? null,
            site_id: input.scope.siteId ?? null,
          }
        : undefined,
      source_section: input.scope?.sourceSection,
      headquarter_id: input.scope?.headquarterId ?? null,
      site_id: input.scope?.siteId ?? null,
      sourceSection: input.scope?.sourceSection,
    }),
  }, {
    fallbackPath: '/api/k2b/imports/apply',
  });
}

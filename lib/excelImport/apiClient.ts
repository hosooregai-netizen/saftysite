'use client';

import { readSafetyAuthToken, SafetyApiError } from '@/lib/safetyApi';
import { buildPublicSafetyApiUpstreamUrl } from '@/lib/safetyApi/upstream';
import type {
  ExcelApplyResult,
  ExcelImportPreview,
  ExcelImportScope,
} from '@/types/excelImport';

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

function appendScope(body: FormData, scope?: ExcelImportScope) {
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

function buildDirectExcelImportUrl(path: string) {
  return buildPublicSafetyApiUpstreamUrl(`/excel-imports${path}`);
}

async function requestExcelImport<T>(
  path: string,
  init: RequestInit,
  options?: {
    fallbackPath?: string;
  },
): Promise<T> {
  const directUrl = buildDirectExcelImportUrl(path);
  const response = await fetch(directUrl ?? options?.fallbackPath ?? path, {
    ...init,
    headers: init.headers,
  });
  if (!response.ok) {
    throw new SafetyApiError(await parseErrorMessage(response), response.status);
  }
  return (await response.json()) as T;
}

export async function parseExcelWorkbook(
  file: File,
  scope?: ExcelImportScope,
): Promise<ExcelImportPreview> {
  const headers = createAuthHeaders();
  const body = new FormData();
  body.set('file', file, file.name);
  appendScope(body, scope);
  return requestExcelImport<ExcelImportPreview>('/parse', {
    method: 'POST',
    body,
    headers,
  }, {
    fallbackPath: '/api/excel-imports/parse',
  });
}

export async function fetchExcelImportPreview(jobId: string): Promise<ExcelImportPreview> {
  const headers = createAuthHeaders();
  return requestExcelImport<ExcelImportPreview>(`/${encodeURIComponent(jobId)}`, {
    cache: 'no-store',
    headers,
  }, {
    fallbackPath: `/api/excel-imports/${encodeURIComponent(jobId)}`,
  });
}

export async function applyExcelWorkbook(input: {
  jobId: string;
  sheetName: string;
  scope?: ExcelImportScope;
}): Promise<ExcelApplyResult> {
  const headers = createAuthHeaders({ json: true });
  return requestExcelImport<ExcelApplyResult>('/apply', {
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
    fallbackPath: '/api/excel-imports/apply',
  });
}

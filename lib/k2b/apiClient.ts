'use client';

import { readSafetyAuthToken, SafetyApiError } from '@/lib/safetyApi';
import type {
  K2bApplyResult,
  K2bColumnMapping,
  K2bImportPreview,
  K2bRowAction,
} from '@/types/k2b';

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

export async function parseK2bWorkbook(file: File): Promise<K2bImportPreview> {
  const headers = createAuthHeaders();
  const body = new FormData();
  body.set('file', file, file.name);
  const response = await fetch('/api/k2b/imports/parse', {
    method: 'POST',
    body,
    headers,
  });
  if (!response.ok) {
    throw new SafetyApiError(await parseErrorMessage(response), response.status);
  }
  return (await response.json()) as K2bImportPreview;
}

export async function fetchK2bImportPreview(jobId: string): Promise<K2bImportPreview> {
  const headers = createAuthHeaders();
  const response = await fetch(`/api/k2b/imports/${encodeURIComponent(jobId)}`, {
    cache: 'no-store',
    headers,
  });
  if (!response.ok) {
    throw new SafetyApiError(await parseErrorMessage(response), response.status);
  }
  return (await response.json()) as K2bImportPreview;
}

export async function applyK2bWorkbook(input: {
  jobId: string;
  sheetName: string;
  mapping: K2bColumnMapping;
  rowActions: K2bRowAction[];
}): Promise<K2bApplyResult> {
  const headers = createAuthHeaders({ json: true });
  const response = await fetch('/api/k2b/imports/apply', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      job_id: input.jobId,
      mapping: input.mapping,
      row_actions: input.rowActions.map((item) => ({
        row_index: item.rowIndex,
        action: item.action,
        headquarter_id: item.headquarterId || undefined,
        site_id: item.siteId || undefined,
      })),
      sheet_name: input.sheetName,
    }),
  });
  if (!response.ok) {
    throw new SafetyApiError(await parseErrorMessage(response), response.status);
  }
  return (await response.json()) as K2bApplyResult;
}

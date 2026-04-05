'use client';

import { readSafetyAuthToken, SafetyApiError } from '@/lib/safetyApi';
import type { FieldSignatureRecord } from '@/types/assist';

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

export async function fetchFieldSignatures(siteId: string, limit = 10): Promise<FieldSignatureRecord[]> {
  const headers = createAuthHeaders();
  const response = await fetch(
    `/api/sites/${encodeURIComponent(siteId)}/field-signatures?limit=${encodeURIComponent(String(limit))}`,
    {
      cache: 'no-store',
      headers,
    },
  );
  if (!response.ok) {
    throw new SafetyApiError(await parseErrorMessage(response), response.status);
  }
  return (await response.json()) as FieldSignatureRecord[];
}

export async function createFieldSignature(input: {
  siteId: string;
  imageDataUrl: string;
  scheduleId?: string | null;
  note?: string | null;
}): Promise<FieldSignatureRecord> {
  const headers = createAuthHeaders({ json: true });
  const response = await fetch(
    `/api/sites/${encodeURIComponent(input.siteId)}/field-signatures`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({
        image_data_url: input.imageDataUrl,
        note: input.note || undefined,
        schedule_id: input.scheduleId || undefined,
      }),
    },
  );
  if (!response.ok) {
    throw new SafetyApiError(await parseErrorMessage(response), response.status);
  }
  return (await response.json()) as FieldSignatureRecord;
}

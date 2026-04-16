'use client';

import { readSafetyAuthToken, SafetyApiError } from '@/lib/safetyApi';

export function buildAdminOriginalPdfApiPath(reportKey: string) {
  return `/api/admin/reports/${encodeURIComponent(reportKey)}/original-pdf`;
}

async function readErrorMessage(response: Response) {
  try {
    const payload = (await response.json()) as { error?: string; detail?: string };
    return payload.error?.trim() || payload.detail?.trim() || '';
  } catch {
    return '';
  }
}

export async function fetchAdminOriginalPdfBlob(
  reportKey: string,
  options: { signal?: AbortSignal } = {},
) {
  const token = readSafetyAuthToken();
  if (!token) {
    throw new SafetyApiError('로그인이 만료되었습니다. 다시 로그인해 주세요.', 401);
  }

  const response = await fetch(buildAdminOriginalPdfApiPath(reportKey), {
    cache: 'no-store',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    signal: options.signal,
  });

  if (!response.ok) {
    const detail = await readErrorMessage(response);
    throw new SafetyApiError(detail || '원본 PDF를 열지 못했습니다.', response.status);
  }

  return response.blob();
}

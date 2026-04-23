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

export function readOriginalPdfFilenameFromHeaders(
  headers: Headers,
  fallback: string,
) {
  const disposition = headers.get('content-disposition') || '';
  const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1]).trim() || fallback;
    } catch {
      return utf8Match[1].trim() || fallback;
    }
  }

  const asciiMatch = disposition.match(/filename="?([^";]+)"?/i);
  return asciiMatch?.[1]?.trim() || fallback;
}

export async function fetchAdminOriginalPdfDocument(
  reportKey: string,
  options: { signal?: AbortSignal; token?: string } = {},
) {
  const token = options.token || readSafetyAuthToken();
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

  return {
    blob: await response.blob(),
    filename: readOriginalPdfFilenameFromHeaders(response.headers, `${reportKey}.pdf`),
  };
}

export async function fetchAdminOriginalPdfBlob(
  reportKey: string,
  options: { signal?: AbortSignal } = {},
) {
  return (await fetchAdminOriginalPdfDocument(reportKey, options)).blob;
}

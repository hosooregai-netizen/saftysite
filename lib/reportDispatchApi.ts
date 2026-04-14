'use client';

import { readSafetyAuthToken, SafetyApiError } from '@/lib/safetyApi';
import type { ReportDispatchMeta } from '@/types/admin';
import type { SafetyReport } from '@/types/backend';

async function parseErrorMessage(response: Response) {
  try {
    const payload = (await response.json()) as Record<string, unknown>;
    if (typeof payload.error === 'string' && payload.error.trim()) return payload.error;
    if (typeof payload.detail === 'string' && payload.detail.trim()) return payload.detail;
  } catch {
    // Ignore invalid JSON errors and fall back to the response status.
  }

  return response.statusText || '요청 처리 중 오류가 발생했습니다.';
}

export async function updateReportDispatch(
  reportKey: string,
  dispatch: ReportDispatchMeta,
): Promise<SafetyReport> {
  const token = readSafetyAuthToken();
  if (!token) {
    throw new SafetyApiError('로그인이 만료되었습니다. 다시 로그인해 주세요.', 401);
  }

  const response = await fetch(`/api/reports/${encodeURIComponent(reportKey)}/dispatch`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(dispatch),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new SafetyApiError(await parseErrorMessage(response), response.status);
  }

  return (await response.json()) as SafetyReport;
}

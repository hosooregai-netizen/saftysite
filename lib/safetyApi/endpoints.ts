import type {
  SafetyContentItem,
  SafetyLoginInput,
  SafetyReport,
  SafetySite,
  SafetyTokenResponse,
  SafetyUpsertReportInput,
  SafetyUser,
} from '@/types/backend';
import { requestSafetyApi } from './client';

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

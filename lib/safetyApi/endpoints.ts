import type {
  SafetyContentItem,
  SafetyLoginInput,
  SafetyReport,
  SafetyReportListItem,
  SafetySite,
  SafetyTechnicalGuidanceSeed,
  SafetyTokenResponse,
  SafetyUpsertReportInput,
  SafetyUser,
} from '@/types/backend';
import { requestSafetyApi } from './client';

const CLIENT_SITE_LIST_LIMIT = 500;
const CLIENT_CONTENT_ITEM_LIMIT = 1000;

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
    active_only: 'true',
    include_headquarter_detail: 'true',
    include_assigned_user: 'true',
    limit: String(CLIENT_SITE_LIST_LIMIT),
  });

  return requestSafetyApi<SafetySite[]>(
    `/assignments/me/sites?${searchParams.toString()}`,
    {},
    token
  );
}

/** 관리자 CRUD와 동일하게 전체·충분한 limit으로 조회. API 기본값(active_only·limit)에 의해 일부 유형만 잘리는 것을 방지. */
export function fetchSafetyContentItems(token: string): Promise<SafetyContentItem[]> {
  const searchParams = new URLSearchParams({
    active_only: 'true',
    limit: String(CLIENT_CONTENT_ITEM_LIMIT),
  });

  return requestSafetyApi<SafetyContentItem[]>(
    `/content-items?${searchParams.toString()}`,
    {},
    token
  );
}

export function fetchSafetyReportsBySite(
  token: string,
  siteId: string
): Promise<SafetyReport[]> {
  const searchParams = new URLSearchParams({
    active_only: 'true',
  });

  return requestSafetyApi<SafetyReport[]>(
    `/reports/site/${siteId}/full?${searchParams.toString()}`,
    {},
    token
  );
}

export function fetchSafetyReportList(
  token: string,
  options?: {
    siteId?: string;
    activeOnly?: boolean;
    limit?: number;
  }
): Promise<SafetyReportListItem[]> {
  const searchParams = new URLSearchParams({
    active_only: String(options?.activeOnly ?? true),
    limit: String(options?.limit ?? 100),
  });

  if (options?.siteId) {
    searchParams.set('site_id', options.siteId);
  }

  return requestSafetyApi<SafetyReportListItem[]>(
    `/reports?${searchParams.toString()}`,
    {},
    token
  );
}

export function fetchSafetyReportByKey(
  token: string,
  reportKey: string
): Promise<SafetyReport> {
  return requestSafetyApi<SafetyReport>(
    `/reports/by-key/${reportKey}`,
    {},
    token
  );
}

export function fetchTechnicalGuidanceSeed(
  token: string,
  siteId: string,
): Promise<SafetyTechnicalGuidanceSeed> {
  return requestSafetyApi<SafetyTechnicalGuidanceSeed>(
    `/reports/site/${siteId}/technical-guidance-seed`,
    {},
    token,
  );
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

import type {
  SafetyContentItem,
  SafetyContentItemListItem,
  SafetySite,
  SafetyUser,
} from '@/types/backend';
import type {
  SafetyAssignment,
  SafetyAssignmentInput,
  SafetyAssignmentUpdateInput,
  SafetyContentItemInput,
  SafetyContentItemUpdateInput,
  SafetyHeadquarter,
  SafetyHeadquarterInput,
  SafetyHeadquarterUpdateInput,
  SafetySiteInput,
  SafetySiteUpdateInput,
  SafetySiteStatus,
  SafetyUserCreateInput,
  SafetyUserUpdateInput,
} from '@/types/controller';
import type { SiteDispatchPolicy } from '@/types/backend';
import { requestSafetyApi, SafetyApiError } from './client';

const ADMIN_LIST_LIMIT = 500;
const ADMIN_CONTENT_ITEM_LIMIT = 1000;

export interface AdminListQueryOptions {
  limit?: number;
  offset?: number;
}

function withQuery(path: string, params: Record<string, string | number | boolean | null | undefined>) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined && value !== '') {
      searchParams.set(key, String(value));
    }
  }

  const query = searchParams.toString();
  return query ? `${path}?${query}` : path;
}

function sendJson<T>(path: string, token: string, method: string, body?: unknown): Promise<T> {
  return requestSafetyApi<T>(path, { method, body: body ? JSON.stringify(body) : undefined }, token);
}

function isHeadquarterWriteFailure(error: unknown): error is SafetyApiError {
  return error instanceof SafetyApiError && error.status === 500;
}

function isDuplicateFieldConflict(error: unknown, fieldName: string): error is SafetyApiError {
  return (
    error instanceof SafetyApiError &&
    error.status === 409 &&
    error.message.toLowerCase().includes(fieldName.toLowerCase())
  );
}

function normalizeSafetySiteStatus(value: string | null | undefined): SafetySiteStatus {
  return value === 'planned' || value === 'active' || value === 'closed' || value === 'deleted'
    ? value
    : 'active';
}

function normalizeSafetySite(site: SafetySite): SafetySite {
  return {
    ...site,
    status: normalizeSafetySiteStatus(site.status),
  };
}

export interface SafetyContentAssetUpload {
  path: string;
  file_name: string;
  content_type: string;
  size: number;
}

export const fetchSafetyUsers = (token: string) =>
  requestSafetyApi<SafetyUser[]>(
    withQuery('/users', { active_only: true, limit: ADMIN_LIST_LIMIT }),
    {},
    token
  );
export const fetchSafetyUsersPage = (token: string, options: AdminListQueryOptions = {}) =>
  requestSafetyApi<SafetyUser[]>(
    withQuery('/users', {
      active_only: true,
      limit: options.limit ?? ADMIN_LIST_LIMIT,
      offset: options.offset ?? 0,
    }),
    {},
    token
  );
export const createSafetyUser = (token: string, body: SafetyUserCreateInput) =>
  sendJson<SafetyUser>('/users', token, 'POST', body);
export const updateSafetyUser = (token: string, userId: string, body: SafetyUserUpdateInput) =>
  sendJson<SafetyUser>(`/users/${userId}`, token, 'PATCH', body);
export const deactivateSafetyUser = (token: string, userId: string) =>
  requestSafetyApi<SafetyUser>(`/users/${userId}`, { method: 'DELETE' }, token);
export const deleteSafetyUser = deactivateSafetyUser;
export const updateSafetyUserPassword = (token: string, userId: string, newPassword: string) =>
  sendJson<{ message: string }>(`/users/${userId}/password`, token, 'POST', { new_password: newPassword });

export const fetchSafetyHeadquarters = (token: string) =>
  requestSafetyApi<SafetyHeadquarter[]>(
    withQuery('/headquarters', { active_only: true, limit: ADMIN_LIST_LIMIT }),
    {},
    token
  );
export const fetchSafetyHeadquartersPage = (token: string, options: AdminListQueryOptions = {}) =>
  requestSafetyApi<SafetyHeadquarter[]>(
    withQuery('/headquarters', {
      active_only: true,
      limit: options.limit ?? ADMIN_LIST_LIMIT,
      offset: options.offset ?? 0,
    }),
    {},
    token
  );
export const createSafetyHeadquarter = async (token: string, body: SafetyHeadquarterInput) => {
  try {
    return await sendJson<SafetyHeadquarter>('/headquarters', token, 'POST', body);
  } catch (error) {
    if (isHeadquarterWriteFailure(error)) {
      throw new SafetyApiError(
        '사업장 저장이 서버에서 실패했습니다. 사업장관리번호/사업장개시번호가 같은 값이 아니라면 서버 로그 확인이 필요합니다.',
        500,
      );
    }
    throw error;
  }
};
export const updateSafetyHeadquarter = async (
  token: string,
  id: string,
  body: SafetyHeadquarterUpdateInput,
) => {
  try {
    return await sendJson<SafetyHeadquarter>(`/headquarters/${id}`, token, 'PATCH', body);
  } catch (error) {
    if (isHeadquarterWriteFailure(error)) {
      throw new SafetyApiError(
        '사업장 수정이 서버에서 실패했습니다. 사업장관리번호/사업장개시번호가 같은 값이 아니라면 서버 로그 확인이 필요합니다.',
        500,
      );
    }
    throw error;
  }
};
export const deactivateSafetyHeadquarter = (token: string, id: string) =>
  requestSafetyApi<SafetyHeadquarter>(`/headquarters/${id}`, { method: 'DELETE' }, token);
export const deleteSafetyHeadquarter = deactivateSafetyHeadquarter;

export const fetchSafetySitesAdmin = (token: string) =>
  requestSafetyApi<SafetySite[]>(
    withQuery('/sites', {
      active_only: true,
      include_headquarter_detail: true,
      include_assigned_user: true,
      limit: ADMIN_LIST_LIMIT,
    }),
    {},
    token
  ).then((sites) => sites.map((site) => normalizeSafetySite(site)));
export const fetchSafetySitesAdminPage = (token: string, options: AdminListQueryOptions = {}) =>
  requestSafetyApi<SafetySite[]>(
    withQuery('/sites', {
      active_only: true,
      include_headquarter_detail: true,
      include_assigned_user: true,
      limit: options.limit ?? ADMIN_LIST_LIMIT,
      offset: options.offset ?? 0,
    }),
    {},
    token
  ).then((sites) => sites.map((site) => normalizeSafetySite(site)));
export const createSafetySite = async (token: string, body: SafetySiteInput) => {
  try {
    const site = await sendJson<SafetySite>('/sites', token, 'POST', body);
    return normalizeSafetySite(site);
  } catch (error) {
    if (isDuplicateFieldConflict(error, 'site_code')) {
      throw new SafetyApiError(
        '현장 저장이 서버에서 실패했습니다. 현장코드가 이미 다른 현장이나 삭제 잔존 데이터와 충돌하고 있습니다.',
        409,
      );
    }
    throw error;
  }
};
export const updateSafetySite = async (token: string, id: string, body: SafetySiteUpdateInput) => {
  try {
    const site = await sendJson<SafetySite>(`/sites/${id}`, token, 'PATCH', body);
    return normalizeSafetySite(site);
  } catch (error) {
    if (isDuplicateFieldConflict(error, 'site_code')) {
      throw new SafetyApiError(
        '현장 수정이 서버에서 실패했습니다. 현장코드가 다른 현장이나 종료 상태 데이터와 충돌하고 있을 수 있습니다.',
        409,
      );
    }
    throw error;
  }
};
export const updateSafetySiteDispatchPolicy = async (
  token: string,
  id: string,
  body: Pick<SiteDispatchPolicy, 'enabled' | 'alerts_enabled'>,
) => {
  const site = await sendJson<SafetySite>(`/sites/${id}/dispatch-policy`, token, 'PATCH', body);
  return normalizeSafetySite(site);
};
export const deactivateSafetySite = (token: string, id: string) =>
  requestSafetyApi<SafetySite>(`/sites/${id}`, { method: 'DELETE' }, token).then((site) =>
    normalizeSafetySite(site)
  );
export const deleteSafetySite = deactivateSafetySite;

export const fetchSafetyAssignments = (token: string) =>
  requestSafetyApi<SafetyAssignment[]>(
    withQuery('/assignments', { active_only: true, limit: ADMIN_LIST_LIMIT }),
    {},
    token
  );
export const fetchSafetyAssignmentsPage = (token: string, options: AdminListQueryOptions = {}) =>
  requestSafetyApi<SafetyAssignment[]>(
    withQuery('/assignments', {
      active_only: true,
      limit: options.limit ?? ADMIN_LIST_LIMIT,
      offset: options.offset ?? 0,
    }),
    {},
    token
  );
export const createSafetyAssignment = (token: string, body: SafetyAssignmentInput) =>
  sendJson<SafetyAssignment>('/assignments', token, 'POST', body);
export const updateSafetyAssignment = (token: string, id: string, body: SafetyAssignmentUpdateInput) =>
  sendJson<SafetyAssignment>(`/assignments/${id}`, token, 'PATCH', body);
export const deactivateSafetyAssignment = (token: string, id: string) =>
  requestSafetyApi<SafetyAssignment>(`/assignments/${id}`, { method: 'DELETE' }, token);
export const deleteSafetyAssignment = deactivateSafetyAssignment;

export const fetchSafetyContentItemsAdmin = (
  token: string,
  options: { includeBody?: boolean } = {},
) =>
  requestSafetyApi<SafetyContentItemListItem[]>(
    withQuery('/content-items', {
      active_only: true,
      include_body: options.includeBody === true,
      limit: ADMIN_CONTENT_ITEM_LIMIT,
    }),
    {},
    token
  );
export const fetchSafetyContentItemsAdminPage = (
  token: string,
  options: AdminListQueryOptions & { includeBody?: boolean } = {},
) =>
  requestSafetyApi<SafetyContentItemListItem[]>(
    withQuery('/content-items', {
      active_only: true,
      include_body: options.includeBody === true,
      limit: options.limit ?? ADMIN_CONTENT_ITEM_LIMIT,
      offset: options.offset ?? 0,
    }),
    {},
    token
  );
export const fetchSafetyContentItemDetail = (token: string, id: string) =>
  requestSafetyApi<SafetyContentItem>(`/content-items/${id}`, {}, token);
export const uploadSafetyContentAsset = (token: string, file: File) => {
  const body = new FormData();
  body.set('file', file);
  return requestSafetyApi<SafetyContentAssetUpload>(
    '/content-items/assets/upload',
    { method: 'POST', body },
    token
  );
};
export const createSafetyContentItem = (token: string, body: SafetyContentItemInput) =>
  sendJson<SafetyContentItem>('/content-items', token, 'POST', body);
export const updateSafetyContentItem = (token: string, id: string, body: SafetyContentItemUpdateInput) =>
  sendJson<SafetyContentItem>(`/content-items/${id}`, token, 'PATCH', body);
export const deactivateSafetyContentItem = (token: string, id: string) =>
  requestSafetyApi<SafetyContentItem>(`/content-items/${id}`, { method: 'DELETE' }, token);
export const deleteSafetyContentItem = deactivateSafetyContentItem;

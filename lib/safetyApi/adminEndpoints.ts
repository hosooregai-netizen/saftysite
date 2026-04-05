import type {
  SafetyContentItem,
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
  SafetyUserCreateInput,
  SafetyUserUpdateInput,
} from '@/types/controller';
import { requestSafetyApi } from './client';

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
export const createSafetyHeadquarter = (token: string, body: SafetyHeadquarterInput) =>
  sendJson<SafetyHeadquarter>('/headquarters', token, 'POST', body);
export const updateSafetyHeadquarter = (token: string, id: string, body: SafetyHeadquarterUpdateInput) =>
  sendJson<SafetyHeadquarter>(`/headquarters/${id}`, token, 'PATCH', body);
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
  );
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
  );
export const createSafetySite = (token: string, body: SafetySiteInput) =>
  sendJson<SafetySite>('/sites', token, 'POST', body);
export const updateSafetySite = (token: string, id: string, body: SafetySiteUpdateInput) =>
  sendJson<SafetySite>(`/sites/${id}`, token, 'PATCH', body);
export const deactivateSafetySite = (token: string, id: string) =>
  requestSafetyApi<SafetySite>(`/sites/${id}`, { method: 'DELETE' }, token);
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

export const fetchSafetyContentItemsAdmin = (token: string) =>
  requestSafetyApi<SafetyContentItem[]>(
    withQuery('/content-items', { active_only: true, limit: ADMIN_CONTENT_ITEM_LIMIT }),
    {},
    token
  );
export const fetchSafetyContentItemsAdminPage = (token: string, options: AdminListQueryOptions = {}) =>
  requestSafetyApi<SafetyContentItem[]>(
    withQuery('/content-items', {
      active_only: true,
      limit: options.limit ?? ADMIN_CONTENT_ITEM_LIMIT,
      offset: options.offset ?? 0,
    }),
    {},
    token
  );
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

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

function sanitizeSiteBody<T extends SafetySiteInput | SafetySiteUpdateInput>(body: T): T {
  const next = { ...body };

  // The live backend currently throws 500 when non-empty date strings are sent.
  if ('project_start_date' in next && typeof next.project_start_date === 'string') {
    delete next.project_start_date;
  }

  if ('project_end_date' in next && typeof next.project_end_date === 'string') {
    delete next.project_end_date;
  }

  return next;
}

export const fetchSafetyUsers = (token: string) =>
  requestSafetyApi<SafetyUser[]>(withQuery('/users', { active_only: false, limit: 200 }), {}, token);
export const createSafetyUser = (token: string, body: SafetyUserCreateInput) =>
  sendJson<SafetyUser>('/users', token, 'POST', body);
export const updateSafetyUser = (token: string, userId: string, body: SafetyUserUpdateInput) =>
  sendJson<SafetyUser>(`/users/${userId}`, token, 'PATCH', body);
export const deactivateSafetyUser = (token: string, userId: string) =>
  requestSafetyApi<SafetyUser>(`/users/${userId}`, { method: 'DELETE' }, token);
export const updateSafetyUserPassword = (token: string, userId: string, newPassword: string) =>
  sendJson<{ message: string }>(`/users/${userId}/password`, token, 'POST', { new_password: newPassword });

export const fetchSafetyHeadquarters = (token: string) =>
  requestSafetyApi<SafetyHeadquarter[]>(
    withQuery('/headquarters', { active_only: false, limit: 200 }),
    {},
    token
  );
export const createSafetyHeadquarter = (token: string, body: SafetyHeadquarterInput) =>
  sendJson<SafetyHeadquarter>('/headquarters', token, 'POST', body);
export const updateSafetyHeadquarter = (token: string, id: string, body: SafetyHeadquarterUpdateInput) =>
  sendJson<SafetyHeadquarter>(`/headquarters/${id}`, token, 'PATCH', body);
export const deactivateSafetyHeadquarter = (token: string, id: string) =>
  requestSafetyApi<SafetyHeadquarter>(`/headquarters/${id}`, { method: 'DELETE' }, token);

export const fetchSafetySitesAdmin = (token: string) =>
  requestSafetyApi<SafetySite[]>(
    withQuery('/sites', {
      include_headquarter_detail: true,
      include_assigned_user: true,
      limit: 200,
    }),
    {},
    token
  );
export const createSafetySite = (token: string, body: SafetySiteInput) =>
  sendJson<SafetySite>('/sites', token, 'POST', sanitizeSiteBody(body));
export const updateSafetySite = (token: string, id: string, body: SafetySiteUpdateInput) =>
  sendJson<SafetySite>(`/sites/${id}`, token, 'PATCH', sanitizeSiteBody(body));
export const deactivateSafetySite = (token: string, id: string) =>
  requestSafetyApi<SafetySite>(`/sites/${id}`, { method: 'DELETE' }, token);

export const fetchSafetyAssignments = (token: string) =>
  requestSafetyApi<SafetyAssignment[]>(
    withQuery('/assignments', { active_only: false, limit: 200 }),
    {},
    token
  );
export const createSafetyAssignment = (token: string, body: SafetyAssignmentInput) =>
  sendJson<SafetyAssignment>('/assignments', token, 'POST', body);
export const updateSafetyAssignment = (token: string, id: string, body: SafetyAssignmentUpdateInput) =>
  sendJson<SafetyAssignment>(`/assignments/${id}`, token, 'PATCH', body);
export const deactivateSafetyAssignment = (token: string, id: string) =>
  requestSafetyApi<SafetyAssignment>(`/assignments/${id}`, { method: 'DELETE' }, token);

export const fetchSafetyContentItemsAdmin = (token: string) =>
  requestSafetyApi<SafetyContentItem[]>(
    withQuery('/content-items', { active_only: false, limit: 200 }),
    {},
    token
  );
export const createSafetyContentItem = (token: string, body: SafetyContentItemInput) =>
  sendJson<SafetyContentItem>('/content-items', token, 'POST', body);
export const updateSafetyContentItem = (token: string, id: string, body: SafetyContentItemUpdateInput) =>
  sendJson<SafetyContentItem>(`/content-items/${id}`, token, 'PATCH', body);
export const deactivateSafetyContentItem = (token: string, id: string) =>
  requestSafetyApi<SafetyContentItem>(`/content-items/${id}`, { method: 'DELETE' }, token);

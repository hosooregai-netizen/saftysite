import {
  fetchAdminAssignmentsPage,
  fetchAdminSitesList,
} from '@/lib/admin/apiClient';
import type { SafetySite } from '@/types/backend';
import type { SafetyAssignment } from '@/types/controller';

type AssignmentPayloadOptions = {
  roleOnSite?: string;
  memo?: string | null;
};

type AssignmentPayloadFallback = {
  role_on_site?: string | null;
  memo?: string | null;
};

export function hasValues(input: object): boolean {
  return Object.keys(input).length > 0;
}

export function buildAssignmentPayload(
  defaultRoleOnSite: string,
  options?: AssignmentPayloadOptions,
  fallback?: AssignmentPayloadFallback,
) {
  return {
    role_on_site: options?.roleOnSite ?? fallback?.role_on_site ?? defaultRoleOnSite,
    memo: options?.memo ?? fallback?.memo ?? null,
  };
}

export async function deleteAssignmentsById(
  token: string,
  assignmentIds: Iterable<string>,
  deactivateAssignment: (token: string, assignmentId: string) => Promise<unknown>,
) {
  const seen = new Set<string>();
  const uniqueAssignmentIds: string[] = [];

  for (const assignmentId of assignmentIds) {
    if (!assignmentId || seen.has(assignmentId)) continue;
    seen.add(assignmentId);
    uniqueAssignmentIds.push(assignmentId);
  }

  const concurrency = 4;
  for (let index = 0; index < uniqueAssignmentIds.length; index += concurrency) {
    await Promise.all(
      uniqueAssignmentIds
        .slice(index, index + concurrency)
        .map((assignmentId) => deactivateAssignment(token, assignmentId)),
    );
  }
}

export async function refreshAdminMasterData(
  refreshMasterData?: () => Promise<void> | void,
) {
  if (!refreshMasterData) return;
  await refreshMasterData();
}

async function fetchAllPages<T>(
  fetchPage: (offset: number, limit: number) => Promise<T[]>,
  limit = 500,
) {
  const rows: T[] = [];
  let offset = 0;

  while (true) {
    const pageRows = await fetchPage(offset, limit);
    rows.push(...pageRows);
    if (pageRows.length < limit) {
      return rows;
    }
    offset += limit;
  }
}

export function loadSafetyAssignmentsForSite(
  _token: string,
  siteId: string,
): Promise<SafetyAssignment[]> {
  void _token;
  return fetchAllPages((offset, limit) =>
    fetchAdminAssignmentsPage({ activeOnly: true, limit, offset, siteId }),
  );
}

export function loadSafetyAssignmentsForUser(
  _token: string,
  userId: string,
): Promise<SafetyAssignment[]> {
  void _token;
  return fetchAllPages((offset, limit) =>
    fetchAdminAssignmentsPage({ activeOnly: true, limit, offset, userId }),
  );
}

export function loadSafetySitesByHeadquarter(
  _token: string,
  headquarterId: string,
): Promise<SafetySite[]> {
  void _token;
  return fetchAllPages((offset, limit) =>
    fetchAdminSitesList({ headquarterId, limit, offset }).then((response) => response.rows),
  );
}

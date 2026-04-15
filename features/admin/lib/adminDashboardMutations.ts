import {
  fetchSafetyAssignmentsPage,
  fetchSafetySitesAdminPage,
} from '@/lib/safetyApi/adminEndpoints';
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

  for (const assignmentId of assignmentIds) {
    if (!assignmentId || seen.has(assignmentId)) continue;
    seen.add(assignmentId);
    await deactivateAssignment(token, assignmentId);
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

export function loadAllSafetyAssignments(token: string): Promise<SafetyAssignment[]> {
  return fetchAllPages((offset, limit) => fetchSafetyAssignmentsPage(token, { limit, offset }));
}

export function loadAllSafetySites(token: string): Promise<SafetySite[]> {
  return fetchAllPages((offset, limit) => fetchSafetySitesAdminPage(token, { limit, offset }));
}

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


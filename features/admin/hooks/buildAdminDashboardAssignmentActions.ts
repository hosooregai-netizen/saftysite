import {
  createSafetyAssignment,
  deactivateSafetyAssignment,
  updateSafetyAssignment,
} from '@/lib/safetyApi/adminEndpoints';
import { SafetyApiError } from '@/lib/safetyApi';
import {
  buildAssignmentPayload,
  loadAllSafetyAssignments,
} from '@/features/admin/lib/adminDashboardMutations';
import { invalidateAdminDirectoryMutationClientCaches } from '@/features/admin/lib/adminClientCacheInvalidation';
import type {
  ControllerDashboardData,
  SafetyAssignmentInput,
  SafetyAssignmentUpdateInput,
} from '@/types/controller';
import { removeRecordById, upsertRecordById } from './adminDashboardStateShared';

type MutationRunner = <TResult>(
  task: (token: string) => Promise<TResult>,
  successMessage: string,
  options?: {
    applyResult?: (current: ControllerDashboardData, result: TResult) => ControllerDashboardData;
    invalidateClientCaches?: (scope: string | null) => void;
  },
) => Promise<TResult>;

interface BuildAdminDashboardAssignmentActionsParams {
  getCurrentData: () => ControllerDashboardData;
  runMutation: MutationRunner;
}

export function buildAdminDashboardAssignmentActions({
  getCurrentData,
  runMutation,
}: BuildAdminDashboardAssignmentActionsParams) {
  const findKnownAssignment = (siteId: string, userId: string) =>
    getCurrentData().assignments.find(
      (assignment) => assignment.site_id === siteId && assignment.user_id === userId,
    );

  return {
    createAssignment: (input: SafetyAssignmentInput) =>
      runMutation(
        async (token) => {
          const existingAssignment = findKnownAssignment(input.site_id, input.user_id);

          if (existingAssignment) {
            return updateSafetyAssignment(token, existingAssignment.id, {
              role_on_site: input.role_on_site ?? existingAssignment.role_on_site,
              memo: input.memo ?? existingAssignment.memo ?? null,
              is_active: true,
            });
          }

          try {
            return await createSafetyAssignment(token, input);
          } catch (error) {
            if (!(error instanceof SafetyApiError) || error.status !== 409) {
              throw error;
            }
            const assignments = await loadAllSafetyAssignments(token);
            const matchedAssignment = assignments.find(
              (assignment) =>
                assignment.site_id === input.site_id && assignment.user_id === input.user_id,
            );
            if (!matchedAssignment) {
              throw error;
            }
            return updateSafetyAssignment(token, matchedAssignment.id, {
              role_on_site: input.role_on_site ?? matchedAssignment.role_on_site,
              memo: input.memo ?? matchedAssignment.memo ?? null,
              is_active: true,
            });
          }
        },
        '현장 배정을 생성했습니다.',
        {
          applyResult: (current, assignment) => ({
            ...current,
            assignments: upsertRecordById(current.assignments, assignment),
          }),
          invalidateClientCaches: invalidateAdminDirectoryMutationClientCaches,
        },
      ),
    assignFieldAgentToSite: (
      siteId: string,
      userId: string,
      options?: { roleOnSite?: string; memo?: string | null },
    ) =>
      runMutation(
        async (token) => {
          const matchedAssignment = findKnownAssignment(siteId, userId);

          if (matchedAssignment) {
            if (matchedAssignment.is_active) {
              return matchedAssignment;
            }

            return updateSafetyAssignment(token, matchedAssignment.id, {
              ...buildAssignmentPayload('현장 지도요원', options, matchedAssignment),
              is_active: true,
            });
          }

          const payload = {
            site_id: siteId,
            user_id: userId,
            ...buildAssignmentPayload('현장 지도요원', options),
          };
          try {
            return await createSafetyAssignment(token, payload);
          } catch (error) {
            if (!(error instanceof SafetyApiError) || error.status !== 409) {
              throw error;
            }
            const assignments = await loadAllSafetyAssignments(token);
            const conflictingAssignment = assignments.find(
              (assignment) => assignment.site_id === siteId && assignment.user_id === userId,
            );
            if (!conflictingAssignment) {
              throw error;
            }
            return updateSafetyAssignment(token, conflictingAssignment.id, {
              ...buildAssignmentPayload('현장 지도요원', options, conflictingAssignment),
              is_active: true,
            });
          }
        },
        '지도요원을 배정했습니다.',
        {
          applyResult: (current, assignment) => ({
            ...current,
            assignments: upsertRecordById(current.assignments, assignment),
          }),
          invalidateClientCaches: invalidateAdminDirectoryMutationClientCaches,
        },
      ),
    unassignFieldAgentFromSite: (siteId: string, userId: string) =>
      runMutation(
        async (token) => {
          const matchedAssignment =
            getCurrentData().assignments.find(
              (assignment) =>
                assignment.site_id === siteId &&
                assignment.user_id === userId &&
                assignment.is_active,
            ) ??
            (await loadAllSafetyAssignments(token)).find(
            (assignment) =>
              assignment.site_id === siteId &&
              assignment.user_id === userId &&
              assignment.is_active,
            );

          if (!matchedAssignment) {
            return null;
          }

          await deactivateSafetyAssignment(token, matchedAssignment.id);
          return { assignmentId: matchedAssignment.id };
        },
        '지도요원 배정을 해제했습니다.',
        {
          applyResult: (current, result) =>
            result
              ? {
                  ...current,
                  assignments: removeRecordById(current.assignments, result.assignmentId),
                }
              : current,
          invalidateClientCaches: invalidateAdminDirectoryMutationClientCaches,
        },
      ),
    updateAssignment: (id: string, input: SafetyAssignmentUpdateInput) =>
      runMutation((token) => updateSafetyAssignment(token, id, input), '배정 정보를 수정했습니다.', {
        applyResult: (current, assignment) => ({
          ...current,
          assignments: upsertRecordById(current.assignments, assignment),
        }),
        invalidateClientCaches: invalidateAdminDirectoryMutationClientCaches,
      }),
    deactivateAssignment: (id: string) =>
      runMutation((token) => deactivateSafetyAssignment(token, id), '배정을 비활성화했습니다.', {
        applyResult: (current, assignment) => ({
          ...current,
          assignments: removeRecordById(current.assignments, assignment.id),
        }),
        invalidateClientCaches: invalidateAdminDirectoryMutationClientCaches,
      }),
  };
}
